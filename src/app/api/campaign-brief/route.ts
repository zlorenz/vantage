/**
 * Campaign Brief form submission handler.
 * Accepts multipart/form-data, validates, then fires Resend (team) + Lark in parallel,
 * plus a best-effort branded confirmation email to the submitter.
 * No submission form-field data is stored. Uploaded files are stored as Sanity assets
 * (campaignBriefAttachment) solely to provide download links in the Lark notification —
 * best-effort, non-blocking.
 */

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS,
  CAMPAIGN_BRIEF_FIELD_LABELS,
  CAMPAIGN_BRIEF_MAX_FILES,
  CAMPAIGN_BRIEF_REQUIRED_FIELDS,
  emailFieldsForCampaignType,
  type CampaignBriefFieldKey,
} from '@/lib/campaign-brief-fields';
import { getCampaignBriefUi } from '@/lib/campaign-brief-i18n';
import { getSanityWriteClient } from '@/lib/sanity-write-client';
import type { Locale } from '@/i18n/routing';

/** Notification recipient for campaign brief submissions. */
const BRIEF_RECIPIENT = 'zacharia@vantage.pictures';

/** Minimum form fill time (ms) — matches Gravity Forms speed check. */
const MIN_SUBMIT_MS = 3000;

const ALLOWED_EXTENSIONS = new Set<string>(CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS);

function resolveLocale(formData: FormData): Locale {
  return getString(formData, 'locale') === 'zh' ? 'zh' : 'en';
}

interface ParsedUpload {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

/** Sanity CDN link for a brief attachment — only present when upload succeeded. */
interface AttachmentLink {
  filename: string;
  url: string;
}

type SanityFileAsset = {
  _id: string;
  url?: string;
  originalFilename?: string;
};

type FieldErrors = Partial<Record<CampaignBriefFieldKey | 'files', string>>;

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value === 'string') return value.trim();
  return '';
}

function getStringArray(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
}

function getBoolFlag(formData: FormData, key: string): string {
  const value = getString(formData, key).toLowerCase();
  return value === 'true' || value === '1' || value === 'on' ? 'true' : '';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
}

async function parseUploads(
  formData: FormData,
  locale: Locale,
): Promise<{ files: ParsedUpload[]; error?: string }> {
  const ui = getCampaignBriefUi(locale);
  const entries = formData.getAll('briefing_materials_upload');
  const fileEntries = entries.filter((e): e is File => e instanceof File && e.size > 0);

  if (fileEntries.length > CAMPAIGN_BRIEF_MAX_FILES) {
    return { files: [], error: ui.maxFilesAllowed(CAMPAIGN_BRIEF_MAX_FILES) };
  }

  const files: ParsedUpload[] = [];

  for (const file of fileEntries) {
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return {
        files: [],
        error: ui.fileTypeNotAllowed(file.name),
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

function parseFields(formData: FormData): Record<CampaignBriefFieldKey, string | string[]> {
  const deliveryUnknown = getBoolFlag(formData, 'delivery_deadline_unknown');
  const shootUnknown = getBoolFlag(formData, 'shoot_event_date_unknown');

  return {
    contact_name_first: getString(formData, 'contact_name_first'),
    contact_name_last: getString(formData, 'contact_name_last'),
    company_name: getString(formData, 'company_name'),
    contact_email: getString(formData, 'contact_email'),
    discovery_source: getString(formData, 'discovery_source'),
    campaign_title: getString(formData, 'campaign_title'),
    campaign_type: getString(formData, 'campaign_type'),
    brand_description: getString(formData, 'brand_description'),
    product_description: getString(formData, 'product_description'),
    campaign_description: getString(formData, 'campaign_description'),
    target_audience: getString(formData, 'target_audience'),
    reference_videos: getString(formData, 'reference_videos'),
    delivery_deadline: deliveryUnknown ? '' : getString(formData, 'delivery_deadline'),
    delivery_deadline_unknown: deliveryUnknown,
    delivery_deadline_note: deliveryUnknown
      ? getString(formData, 'delivery_deadline_note')
      : '',
    extra_deliverables: getStringArray(formData, 'extra_deliverables'),
    extra_deliverables_other_note: getString(formData, 'extra_deliverables_other_note'),
    budget_range: getString(formData, 'budget_range'),
    project_description: getString(formData, 'project_description'),
    shoot_event_date: shootUnknown ? '' : getString(formData, 'shoot_event_date'),
    shoot_event_date_unknown: shootUnknown,
    shoot_event_date_note: shootUnknown ? getString(formData, 'shoot_event_date_note') : '',
    production_scope: getString(formData, 'production_scope'),
    social_channels: getStringArray(formData, 'social_channels'),
    aspect_ratios: getStringArray(formData, 'aspect_ratios'),
    additional_notes: getString(formData, 'additional_notes'),
  };
}

function validateFields(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  locale: Locale,
): FieldErrors {
  const ui = getCampaignBriefUi(locale);
  const errors: FieldErrors = {};

  for (const key of CAMPAIGN_BRIEF_REQUIRED_FIELDS) {
    const value = fields[key];
    const empty = Array.isArray(value) ? value.length === 0 : !String(value).trim();
    if (empty) {
      errors[key] = ui.fieldRequired;
    }
  }

  if (fields.contact_email && !isValidEmail(String(fields.contact_email))) {
    errors.contact_email = ui.invalidEmail;
  }

  return errors;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatValue(value: string | string[] | undefined): string {
  if (!value || (Array.isArray(value) && value.length === 0)) return '—';
  if (Array.isArray(value)) return escapeHtml(value.join(', '));
  const trimmed = value.trim();
  return trimmed ? escapeHtml(trimmed).replace(/\n/g, '<br>') : '—';
}

function formatDateFieldDisplay(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  dateKey: 'delivery_deadline' | 'shoot_event_date',
): string {
  const unknownKey =
    dateKey === 'delivery_deadline'
      ? 'delivery_deadline_unknown'
      : 'shoot_event_date_unknown';
  const noteKey =
    dateKey === 'delivery_deadline' ? 'delivery_deadline_note' : 'shoot_event_date_note';

  if (String(fields[unknownKey]) === 'true') {
    const note = String(fields[noteKey] ?? '').trim();
    return note
      ? `No specific date yet — ${escapeHtml(note)}`
      : 'No specific date yet';
  }

  return formatValue(fields[dateKey]);
}

function emailRow(label: string, valueHtml: string): string {
  return `<tr><td style="padding:8px 16px 8px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:8px 0;vertical-align:top;">${valueHtml}</td></tr>`;
}

function buildSection(title: string, rows: string): string {
  return `
      <h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #ddd;padding-bottom:4px;">${escapeHtml(title)}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
    `;
}

/**
 * Build grouped HTML email — Contact, branch-relevant Campaign Details, Final Notes.
 */
function buildEmailHtml(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: ParsedUpload[],
): string {
  const contactKeys: CampaignBriefFieldKey[] = [
    'contact_name_first',
    'contact_name_last',
    'company_name',
    'contact_email',
    'discovery_source',
  ];

  const contactRows = contactKeys
    .map((key) => emailRow(CAMPAIGN_BRIEF_FIELD_LABELS[key], formatValue(fields[key])))
    .join('');

  const campaignType = String(fields.campaign_type);
  let campaignKeys = emailFieldsForCampaignType(campaignType);

  // Documentary: delivery deadline only when post-production is included.
  if (
    campaignType === 'Documentary / Live Event' &&
    String(fields.production_scope) !== 'Filming + post-production'
  ) {
    campaignKeys = campaignKeys.filter((key) => key !== 'delivery_deadline');
  }

  const campaignRows = campaignKeys
    .map((key) => {
      if (key === 'delivery_deadline') {
        return emailRow(
          CAMPAIGN_BRIEF_FIELD_LABELS.delivery_deadline,
          formatDateFieldDisplay(fields, 'delivery_deadline'),
        );
      }
      if (key === 'shoot_event_date') {
        return emailRow(
          CAMPAIGN_BRIEF_FIELD_LABELS.shoot_event_date,
          formatDateFieldDisplay(fields, 'shoot_event_date'),
        );
      }
      if (
        key === 'extra_deliverables_other_note' &&
        !(Array.isArray(fields.extra_deliverables) && fields.extra_deliverables.includes('Other'))
      ) {
        return '';
      }
      return emailRow(CAMPAIGN_BRIEF_FIELD_LABELS[key], formatValue(fields[key]));
    })
    .join('');

  const fileRow = emailRow(
    'Upload Files',
    files.length === 0 ? '—' : escapeHtml(files.map((f) => f.filename).join(', ')),
  );
  const finalRows =
    emailRow(
      CAMPAIGN_BRIEF_FIELD_LABELS.additional_notes,
      formatValue(fields.additional_notes),
    ) + fileRow;

  const sections = [
    buildSection('Contact', contactRows),
    buildSection('Campaign Details', campaignRows),
    buildSection('Final Notes', finalRows),
  ].join('');

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#111;max-width:720px;">${sections}</body></html>`;
}

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
  const campaignTitle = String(fields.campaign_title);
  const companyName = String(fields.company_name);

  // TODO: verify domain in Resend before production — sender must use verified vantage.pictures domain.
  const { error } = await resend.emails.send({
    from,
    to: BRIEF_RECIPIENT,
    subject: `New Campaign Brief: ${campaignTitle} — ${companyName}`,
    html: buildEmailHtml(fields, files),
    attachments: files.map((f) => ({
      filename: f.filename,
      content: f.buffer,
    })),
  });

  if (error) throw new Error(error.message);
}

const CONFIRMATION_REPLY_TO = 'info@vantage.pictures';
/** Embedded logo — avoids relying on production /brand/* URLs pre-cutover. */
const CONFIRMATION_LOGO_DATA_URI = `data:image/png;base64,${readFileSync(
  join(process.cwd(), 'public/brand/vantage-logo-192.png'),
).toString('base64')}`;

type ConfirmationCopy = {
  subject: string;
  thankYou: string;
  summaryHeading: string;
  filesReceived: (filenames: string) => string;
  noSpecificDate: string;
  noSpecificDateWithNote: (note: string) => string;
  signOff: string;
  contactPrefix: string;
  visitSite: string;
};

const CONFIRMATION_COPY: Record<Locale, ConfirmationCopy> = {
  en: {
    subject: "We've received your campaign brief — Vantage Pictures",
    thankYou:
      "Thanks for sending over your campaign brief. We've received it and will be in touch soon.",
    summaryHeading: "Here's a copy of what you submitted:",
    filesReceived: (filenames) => `Files received: ${filenames}`,
    noSpecificDate: 'No specific date yet',
    noSpecificDateWithNote: (note) => `No specific date yet — ${note}`,
    signOff: 'The Vantage Pictures Team',
    contactPrefix: 'Questions? Email us at',
    visitSite: 'vantage.pictures',
  },
  zh: {
    subject: '我们已收到您的项目简报 — Vantage Pictures',
    thankYou: '感谢您提交项目简报。我们已收到，并将尽快与您联系。',
    summaryHeading: '以下是您提交内容的副本：',
    filesReceived: (filenames) => `已收到的文件：${filenames}`,
    noSpecificDate: '暂无具体日期',
    noSpecificDateWithNote: (note) => `暂无具体日期 — ${note}`,
    signOff: 'Vantage Pictures 团队',
    contactPrefix: '如有疑问，请发送邮件至',
    visitSite: 'vantage.pictures',
  },
};

function optionLabelLookup(locale: Locale, campaignType: string): Map<string, string> {
  const ui = getCampaignBriefUi(locale);
  const map = new Map<string, string>();
  const groups = [
    ui.discoverySources,
    ui.campaignTypes,
    ui.productionScopes,
    ui.extraDeliverables,
    ui.socialChannels,
    ui.aspectRatios,
    ui.budgetOptionsForType(campaignType),
  ];
  for (const group of groups) {
    for (const opt of group) {
      map.set(opt.value, opt.label);
    }
  }
  return map;
}

function formatConfirmationValue(
  value: string | string[] | undefined,
  labels: Map<string, string>,
): string {
  if (!value || (Array.isArray(value) && value.length === 0)) return '—';
  if (Array.isArray(value)) {
    return escapeHtml(value.map((v) => labels.get(v) ?? v).join(', '));
  }
  const trimmed = value.trim();
  if (!trimmed) return '—';
  const labeled = labels.get(trimmed) ?? trimmed;
  return escapeHtml(labeled).replace(/\n/g, '<br>');
}

function formatConfirmationDateDisplay(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  dateKey: 'delivery_deadline' | 'shoot_event_date',
  copy: ConfirmationCopy,
): string {
  const unknownKey =
    dateKey === 'delivery_deadline'
      ? 'delivery_deadline_unknown'
      : 'shoot_event_date_unknown';
  const noteKey =
    dateKey === 'delivery_deadline' ? 'delivery_deadline_note' : 'shoot_event_date_note';

  if (String(fields[unknownKey]) === 'true') {
    const note = String(fields[noteKey] ?? '').trim();
    return note
      ? escapeHtml(copy.noSpecificDateWithNote(note))
      : escapeHtml(copy.noSpecificDate);
  }

  return formatValue(fields[dateKey]);
}

function confirmationFieldLabel(
  key: CampaignBriefFieldKey,
  campaignType: string,
  locale: Locale,
): string {
  const ui = getCampaignBriefUi(locale);
  if (key === 'campaign_description' && campaignType === 'Social Media') {
    return ui.campaignDescriptionSocialLabel;
  }
  return ui.fieldLabels[key];
}

/**
 * Branded submitter confirmation — table layout, locale-aware copy.
 * Field list mirrors the team email via emailFieldsForCampaignType().
 */
function buildConfirmationEmailHtml(
  locale: Locale,
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  uploadedFilenames: string[],
): string {
  const copy = CONFIRMATION_COPY[locale];
  const campaignType = String(fields.campaign_type);
  const labels = optionLabelLookup(locale, campaignType);
  const firstName = String(fields.contact_name_first).trim();
  const greetingText =
    locale === 'zh'
      ? firstName
        ? `${firstName}，您好：`
        : '您好：'
      : firstName
        ? `Hi ${firstName},`
        : 'Hi,';

  let campaignKeys = emailFieldsForCampaignType(campaignType);
  if (
    campaignType === 'Documentary / Live Event' &&
    String(fields.production_scope) !== 'Filming + post-production'
  ) {
    campaignKeys = campaignKeys.filter((key) => key !== 'delivery_deadline');
  }

  const rows = campaignKeys
    .map((key) => {
      if (
        key === 'extra_deliverables_other_note' &&
        !(Array.isArray(fields.extra_deliverables) && fields.extra_deliverables.includes('Other'))
      ) {
        return '';
      }

      let valueHtml: string;
      if (key === 'delivery_deadline') {
        valueHtml = formatConfirmationDateDisplay(fields, 'delivery_deadline', copy);
      } else if (key === 'shoot_event_date') {
        valueHtml = formatConfirmationDateDisplay(fields, 'shoot_event_date', copy);
      } else {
        valueHtml = formatConfirmationValue(fields[key], labels);
      }

      const label = confirmationFieldLabel(key, campaignType, locale);
      return `<tr>
        <td style="padding:10px 16px 10px 0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;color:#111;vertical-align:top;width:40%;">${escapeHtml(label)}</td>
        <td style="padding:10px 0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#333;vertical-align:top;">${valueHtml}</td>
      </tr>`;
    })
    .join('');

  const filesBlock =
    uploadedFilenames.length > 0
      ? `<p style="margin:24px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#333;line-height:1.5;">${escapeHtml(copy.filesReceived(uploadedFilenames.join(', ')))}</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-collapse:collapse;">
          <tr>
            <td align="center" style="background:#000000;padding:28px 24px;">
              <img src="${CONFIRMATION_LOGO_DATA_URI}" alt="Vantage Pictures" width="96" height="96" style="display:block;margin:0 auto;border:0;outline:none;width:96px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;font-family:system-ui,-apple-system,sans-serif;font-size:16px;color:#111;line-height:1.5;">
              <p style="margin:0 0 16px;">${escapeHtml(greetingText)}</p>
              <p style="margin:0 0 24px;">${escapeHtml(copy.thankYou)}</p>
              <p style="margin:0 0 12px;font-weight:600;">${escapeHtml(copy.summaryHeading)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:2px solid #f9db24;padding-top:4px;">
                ${rows}
              </table>
              ${filesBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 36px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#555;line-height:1.6;">
              <div style="border-top:1px solid #eee;padding-top:24px;">
                <p style="margin:0 0 8px;color:#111;font-weight:600;">${escapeHtml(copy.signOff)}</p>
                <p style="margin:0 0 4px;">${escapeHtml(copy.contactPrefix)} <a href="mailto:info@vantage.pictures" style="color:#f9db24;text-decoration:none;">info@vantage.pictures</a></p>
                <p style="margin:0;"><a href="https://vantage.pictures" style="color:#f9db24;text-decoration:none;">${escapeHtml(copy.visitSite)}</a></p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendConfirmationEmail(
  locale: Locale,
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: ParsedUpload[],
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('Email service is not configured.');
  }

  const toEmail = String(fields.contact_email).trim();
  if (!toEmail || !isValidEmail(toEmail)) {
    throw new Error(`Invalid confirmation recipient: ${toEmail || '(empty)'}`);
  }

  const resend = new Resend(apiKey);
  const copy = CONFIRMATION_COPY[locale];
  const { error } = await resend.emails.send({
    from,
    to: toEmail,
    replyTo: CONFIRMATION_REPLY_TO,
    subject: copy.subject,
    html: buildConfirmationEmailHtml(
      locale,
      fields,
      files.map((f) => f.filename),
    ),
  });

  if (error) throw new Error(error.message);
}

function formatLarkAttachments(
  files: ParsedUpload[],
  links: AttachmentLink[],
): string {
  if (files.length === 0) return 'No files attached';

  const byName = new Map(links.map((l) => [l.filename, l.url]));
  const lines = files.map((f) => {
    const url = byName.get(f.filename);
    return url ? `• [${f.filename}](${url})` : `• ${f.filename}`;
  });

  return `${files.length} file${files.length === 1 ? '' : 's'} attached — see email for downloads:\n${lines.join('\n')}`;
}

/**
 * Best-effort: upload buffers to Sanity + create one campaignBriefAttachment doc.
 * Returns CDN links for Lark. Throws on failure (caller catches).
 */
async function storeCampaignBriefAttachments(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: ParsedUpload[],
): Promise<AttachmentLink[]> {
  if (files.length === 0) return [];

  const client = getSanityWriteClient();
  const uploaded: Array<{ filename: string; asset: SanityFileAsset }> = [];

  for (const file of files) {
    const asset = (await client.assets.upload('file', file.buffer, {
      filename: file.filename,
      contentType: file.contentType,
    })) as SanityFileAsset;
    uploaded.push({ filename: file.filename, asset });
  }

  await client.create({
    _type: 'campaignBriefAttachment',
    companyName: String(fields.company_name),
    campaignTitle: String(fields.campaign_title),
    contactEmail: String(fields.contact_email),
    campaignType: String(fields.campaign_type),
    files: uploaded.map(({ filename, asset }) => ({
      _key: randomUUID().replace(/-/g, '').slice(0, 12),
      _type: 'briefFile',
      originalFilename: asset.originalFilename || filename,
      file: {
        _type: 'file',
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      },
    })),
  });

  return uploaded.map(({ filename, asset }) => {
    if (!asset.url) {
      throw new Error(`Sanity file asset missing url for ${filename}`);
    }
    return { filename, url: asset.url };
  });
}

async function sendLarkNotification(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: ParsedUpload[],
  attachmentLinks: AttachmentLink[] = [],
): Promise<void> {
  const webhookUrl = process.env.LARK_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('Lark webhook is not configured.');

  const contactName = `${fields.contact_name_first} ${fields.contact_name_last}`.trim();
  const campaignType = String(fields.campaign_type).trim() || '—';
  const fileNote = formatLarkAttachments(files, attachmentLinks);

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
            text: { tag: 'lark_md', content: `**Campaign**\n${fields.campaign_title}` },
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
            text: { tag: 'lark_md', content: `**Campaign type**\n${campaignType}` },
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
  let locale: Locale = 'en';

  try {
    const formData = await request.formData();
    locale = resolveLocale(formData);

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
    const fieldErrors = validateFields(fields, locale);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ success: false, errors: fieldErrors }, { status: 400 });
    }

    const { files, error: fileError } = await parseUploads(formData, locale);
    if (fileError) {
      return NextResponse.json(
        { success: false, errors: { files: fileError } },
        { status: 400 },
      );
    }

    // Best-effort Sanity upload before Lark so the card can include CDN links.
    // Must not fail the request; on failure Lark falls back to filename-only.
    let attachmentLinks: AttachmentLink[] = [];
    if (files.length > 0) {
      try {
        attachmentLinks = await storeCampaignBriefAttachments(fields, files);
      } catch (err) {
        console.error(
          `Campaign brief Sanity upload failed for ${String(fields.contact_email)}:`,
          err,
        );
      }
    }

    await Promise.all([
      sendResendEmail(fields, files),
      sendLarkNotification(fields, files, attachmentLinks),
    ]);

    // Best-effort submitter confirmation — failures are logged only; response stays success.
    try {
      await sendConfirmationEmail(locale, fields, files);
    } catch (err) {
      console.error(
        `Confirmation email failed for ${String(fields.contact_email)}:`,
        err,
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[campaign-brief] submission failed:', err);
    return NextResponse.json(
      { success: false, error: getCampaignBriefUi(locale).submitError },
      { status: 500 },
    );
  }
}
