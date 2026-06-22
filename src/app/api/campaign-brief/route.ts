/**
 * Campaign Brief form submission handler.
 * Accepts multipart/form-data, validates, then fires Resend email + Lark webhook in parallel.
 * No submission data is stored — fire-and-forward only.
 */

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS,
  CAMPAIGN_BRIEF_FIELD_LABELS,
  CAMPAIGN_BRIEF_MAX_FILES,
  CAMPAIGN_BRIEF_REQUIRED_FIELDS,
  CAMPAIGN_BRIEF_STEPS,
  type CampaignBriefFieldKey,
} from '@/lib/campaign-brief-fields';

/** Notification recipient for campaign brief submissions. */
const BRIEF_RECIPIENT = 'zacharia@vantage.pictures';

/** Minimum form fill time (ms) — matches Gravity Forms speed check. */
const MIN_SUBMIT_MS = 3000;

const ALLOWED_EXTENSIONS = new Set<string>(CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS);

/** Parsed file held in memory for the request lifetime only. */
interface ParsedUpload {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

/** Structured validation errors keyed by field name. */
type FieldErrors = Partial<Record<CampaignBriefFieldKey | 'files', string>>;

/**
 * Extract a trimmed string from FormData for a given key.
 */
function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value === 'string') return value.trim();
  return '';
}

/**
 * Extract checkbox values — deliverables submitted as repeated keys.
 */
function getStringArray(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Basic email format check for lead form validation.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Lowercase file extension from filename.
 */
function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
}

/**
 * Parse uploaded files from FormData — memory only, never written to disk.
 */
async function parseUploads(
  formData: FormData,
): Promise<{ files: ParsedUpload[]; error?: string }> {
  const entries = formData.getAll('briefing_materials_upload');
  const fileEntries = entries.filter((e): e is File => e instanceof File && e.size > 0);

  if (fileEntries.length > CAMPAIGN_BRIEF_MAX_FILES) {
    return { files: [], error: `Maximum ${CAMPAIGN_BRIEF_MAX_FILES} files allowed.` };
  }

  const files: ParsedUpload[] = [];

  for (const file of fileEntries) {
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return {
        files: [],
        error: `File type not allowed: ${file.name}. Accepted: ${CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    files.push({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      buffer,
    });
  }

  return { files };
}

/**
 * Build flat record of all 42 field values from FormData.
 */
function parseFields(formData: FormData): Record<CampaignBriefFieldKey, string | string[]> {
  return {
    project_title: getString(formData, 'project_title'),
    company_name: getString(formData, 'company_name'),
    project_type: getString(formData, 'project_type'),
    discovery_source: getString(formData, 'discovery_source'),
    referral_source_other: getString(formData, 'referral_source_other'),
    referrer_name: getString(formData, 'referrer_name'),
    contact_name_first: getString(formData, 'contact_name_first'),
    contact_name_last: getString(formData, 'contact_name_last'),
    contact_job_title: getString(formData, 'contact_job_title'),
    contact_email: getString(formData, 'contact_email'),
    contact_phone: getString(formData, 'contact_phone'),
    campaign_goals: getString(formData, 'campaign_goals'),
    key_message: getString(formData, 'key_message'),
    target_audience: getString(formData, 'target_audience'),
    desired_runtime: getString(formData, 'desired_runtime'),
    video_tone_style: getString(formData, 'video_tone_style'),
    reference_videos: getString(formData, 'reference_videos'),
    campaign_keywords_or_avoidances: getString(formData, 'campaign_keywords_or_avoidances'),
    budget_range: getString(formData, 'budget_range'),
    distribution_channels: getString(formData, 'distribution_channels'),
    target_regions: getString(formData, 'target_regions'),
    usage_rights_term: getString(formData, 'usage_rights_term'),
    delivery_deadline: getString(formData, 'delivery_deadline'),
    delivery_flexibility: getString(formData, 'delivery_flexibility'),
    launch_timing: getString(formData, 'launch_timing'),
    brand_description: getString(formData, 'brand_description'),
    brand_mission: getString(formData, 'brand_mission'),
    campaign_focus: getString(formData, 'campaign_focus'),
    product_name: getString(formData, 'product_name'),
    product_key_features: getString(formData, 'product_key_features'),
    market_pain_points: getString(formData, 'market_pain_points'),
    product_differentiators: getString(formData, 'product_differentiators'),
    deliverables: getStringArray(formData, 'deliverables'),
    cutdown_durations: getString(formData, 'cutdown_durations'),
    cutdown_distribution: getString(formData, 'cutdown_distribution'),
    social_channels: getString(formData, 'social_channels'),
    social_aspect_ratios: getString(formData, 'social_aspect_ratios'),
    social_platform_requirements: getString(formData, 'social_platform_requirements'),
    stills_type: getString(formData, 'stills_type'),
    photography_requirements: getString(formData, 'photography_requirements'),
    stills_quantity: getString(formData, 'stills_quantity'),
    additional_notes: getString(formData, 'additional_notes'),
  };
}

/**
 * Validate required fields and email format.
 */
function validateFields(fields: Record<CampaignBriefFieldKey, string | string[]>): FieldErrors {
  const errors: FieldErrors = {};

  for (const key of CAMPAIGN_BRIEF_REQUIRED_FIELDS) {
    const value = fields[key];
    const empty = Array.isArray(value) ? value.length === 0 : !String(value).trim();
    if (empty) {
      errors[key] = 'This field is required.';
    }
  }

  if (fields.contact_email && !isValidEmail(String(fields.contact_email))) {
    errors.contact_email = 'Please enter a valid email address.';
  }

  return errors;
}

/**
 * Escape HTML entities for safe inclusion in email body.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format a field value for display — empty values shown as em dash.
 */
function formatValue(value: string | string[] | undefined): string {
  if (!value || (Array.isArray(value) && value.length === 0)) return '—';
  if (Array.isArray(value)) return escapeHtml(value.join(', '));
  const trimmed = value.trim();
  return trimmed ? escapeHtml(trimmed).replace(/\n/g, '<br>') : '—';
}

/**
 * Build grouped HTML email body from all submitted fields.
 */
function buildEmailHtml(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: ParsedUpload[],
): string {
  const sections = CAMPAIGN_BRIEF_STEPS.map((step) => {
    const rows = step.fields
      .map((key) => {
        const label = CAMPAIGN_BRIEF_FIELD_LABELS[key];
        return `<tr><td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:8px 0;vertical-align:top;">${formatValue(fields[key])}</td></tr>`;
      })
      .join('');

    const fileRow =
      step.step === 7
        ? `<tr><td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;white-space:nowrap;">Briefing materials upload</td><td style="padding:8px 0;vertical-align:top;">${files.length === 0 ? '—' : escapeHtml(files.map((f) => f.filename).join(', '))}</td></tr>`
        : '';

    return `
      <h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #ddd;padding-bottom:4px;">${escapeHtml(step.title)}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}${fileRow}</table>
    `;
  }).join('');

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#111;max-width:720px;">${sections}</body></html>`;
}

/**
 * Send notification email via Resend with file attachments.
 */
async function sendResendEmail(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: ParsedUpload[],
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('Email service is not configured.');
  }

  const resend = new Resend(apiKey);
  const projectTitle = String(fields.project_title);
  const companyName = String(fields.company_name);

  // TODO: verify domain in Resend before production — sender must use verified vantage.pictures domain.
  const { error } = await resend.emails.send({
    from,
    to: BRIEF_RECIPIENT,
    subject: `New Campaign Brief: ${projectTitle} — ${companyName}`,
    html: buildEmailHtml(fields, files),
    attachments: files.map((f) => ({
      filename: f.filename,
      content: f.buffer,
    })),
  });

  if (error) throw new Error(error.message);
}

/**
 * Send Lark Interactive Card notification — filenames only, no file payloads.
 */
async function sendLarkNotification(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: ParsedUpload[],
): Promise<void> {
  const webhookUrl = process.env.LARK_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('Lark webhook is not configured.');

  const contactName = `${fields.contact_name_first} ${fields.contact_name_last}`.trim();
  const projectType = String(fields.project_type).trim() || '—';
  const fileNote =
    files.length === 0
      ? 'No files attached'
      : `${files.length} file${files.length === 1 ? '' : 's'} attached — see email for downloads:\n${files.map((f) => `• ${f.filename}`).join('\n')}`;

  const card = {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { tag: 'plain_text', content: 'New Campaign Brief' },
    },
    elements: [
      {
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**Project**\n${fields.project_title}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**Company**\n${fields.company_name}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**Contact**\n${contactName}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**Email**\n${fields.contact_email}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**Budget**\n${fields.budget_range}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**Project type**\n${projectType}` },
          },
        ],
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**Attachments**\n${fileNote}` },
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msg_type: 'interactive', card }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Lark webhook failed (${response.status}): ${body}`);
  }

  const result = (await response.json()) as { StatusCode?: number; StatusMessage?: string };
  if (result.StatusCode !== undefined && result.StatusCode !== 0) {
    throw new Error(`Lark webhook error: ${result.StatusMessage ?? JSON.stringify(result)}`);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Honeypot — silently accept but discard if populated.
    if (getString(formData, 'website')) {
      return NextResponse.json({ success: true });
    }

    // Speed check — silently accept if submitted too fast.
    const elapsed = Number(getString(formData, '_form_elapsed_ms'));
    if (!Number.isNaN(elapsed) && elapsed < MIN_SUBMIT_MS) {
      return NextResponse.json({ success: true });
    }

    const fields = parseFields(formData);
    const fieldErrors = validateFields(fields);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ success: false, errors: fieldErrors }, { status: 400 });
    }

    const { files, error: fileError } = await parseUploads(formData);
    if (fileError) {
      return NextResponse.json(
        { success: false, errors: { files: fileError } },
        { status: 400 },
      );
    }

    await Promise.all([sendResendEmail(fields, files), sendLarkNotification(fields, files)]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[campaign-brief] submission failed:', err);
    return NextResponse.json(
      { success: false, error: 'Submission failed. Please try again.' },
      { status: 500 },
    );
  }
}
