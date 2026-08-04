/**
 * Campaign Brief form submission handler.
 * Accepts JSON (fields + pre-uploaded Sanity asset metadata — no raw file bytes).
 * Fires Resend (team) + Lark in parallel, plus a best-effort branded confirmation
 * email to the submitter. Form-field data is not stored. A campaignBriefAttachment
 * document is created best-effort from already-uploaded asset refs so Lark/emails
 * can link CDN URLs.
 *
 * Token split:
 * - Browser uploads use NEXT_PUBLIC_SANITY_UPLOAD_TOKEN (client-only).
 * - This route uses SANITY_API_WRITE_TOKEN via getSanityWriteClient() (server-only).
 */

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  CAMPAIGN_BRIEF_FIELD_LABELS,
  CAMPAIGN_BRIEF_MAX_FILES,
  CAMPAIGN_BRIEF_REQUIRED_FIELDS,
  emailFieldsForCampaignType,
  type CampaignBriefFieldKey,
} from '@/lib/campaign-brief-fields';
import { getCampaignBriefUi } from '@/lib/campaign-brief-i18n';
import {
  formatFileSizeMb,
  partitionResendAttachments,
  type BriefAttachmentMeta,
} from '@/lib/campaign-brief-attachments';
import { getSanityWriteClient } from '@/lib/sanity-write-client';
import type { Locale } from '@/i18n/routing';

/** Notification recipient for campaign brief submissions. */
const BRIEF_RECIPIENT = 'info@vantage.pictures';

/** Minimum form fill time (ms) — matches Gravity Forms speed check. */
const MIN_SUBMIT_MS = 3000;

type FieldErrors = Partial<Record<CampaignBriefFieldKey | 'files', string>>;

type BriefSubmitPayload = {
  locale?: string;
  website?: string;
  _form_elapsed_ms?: number | string;
  attachments?: unknown;
} & Partial<Record<CampaignBriefFieldKey, unknown>>;

function resolveLocale(payload: BriefSubmitPayload): Locale {
  return payload.locale === 'zh' ? 'zh' : 'en';
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
}

function asBoolFlag(value: unknown): string {
  if (value === true || value === 1) return 'true';
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'on') return 'true';
  }
  return '';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSanityCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'cdn.sanity.io';
  } catch {
    return false;
  }
}

function parseAttachments(
  raw: unknown,
  locale: Locale,
): { files: BriefAttachmentMeta[]; error?: string } {
  const ui = getCampaignBriefUi(locale);
  if (raw == null) return { files: [] };
  if (!Array.isArray(raw)) {
    return { files: [], error: ui.fieldRequired };
  }
  if (raw.length > CAMPAIGN_BRIEF_MAX_FILES) {
    return { files: [], error: ui.maxFilesAllowed(CAMPAIGN_BRIEF_MAX_FILES) };
  }

  const files: BriefAttachmentMeta[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      return { files: [], error: ui.fieldRequired };
    }
    const row = item as Record<string, unknown>;
    const filename = asString(row.filename);
    const assetId = asString(row.assetId);
    const cdnUrl = asString(row.cdnUrl);
    const size = typeof row.size === 'number' ? row.size : Number(row.size);

    if (
      !filename ||
      !assetId.startsWith('file-') ||
      !isSanityCdnUrl(cdnUrl) ||
      !Number.isFinite(size) ||
      size < 0
    ) {
      return { files: [], error: ui.fileTypeNotAllowed(filename || 'attachment') };
    }

    files.push({ filename, assetId, cdnUrl, size });
  }

  return { files };
}

function parseFields(
  payload: BriefSubmitPayload,
): Record<CampaignBriefFieldKey, string | string[]> {
  const deliveryUnknown = asBoolFlag(payload.delivery_deadline_unknown);
  const shootUnknown = asBoolFlag(payload.shoot_event_date_unknown);

  return {
    contact_name_first: asString(payload.contact_name_first),
    contact_name_last: asString(payload.contact_name_last),
    company_name: asString(payload.company_name),
    contact_email: asString(payload.contact_email),
    discovery_source: asString(payload.discovery_source),
    campaign_title: asString(payload.campaign_title),
    campaign_type: asString(payload.campaign_type),
    brand_description: asString(payload.brand_description),
    product_description: asString(payload.product_description),
    campaign_description: asString(payload.campaign_description),
    target_audience: asString(payload.target_audience),
    reference_videos: asString(payload.reference_videos),
    delivery_deadline: deliveryUnknown ? '' : asString(payload.delivery_deadline),
    delivery_deadline_unknown: deliveryUnknown,
    delivery_deadline_note: deliveryUnknown ? asString(payload.delivery_deadline_note) : '',
    extra_deliverables: asStringArray(payload.extra_deliverables),
    extra_deliverables_other_note: asString(payload.extra_deliverables_other_note),
    budget_range: asString(payload.budget_range),
    project_description: asString(payload.project_description),
    shoot_event_date: shootUnknown ? '' : asString(payload.shoot_event_date),
    shoot_event_date_unknown: shootUnknown,
    shoot_event_date_note: shootUnknown ? asString(payload.shoot_event_date_note) : '',
    production_scope: asString(payload.production_scope),
    social_channels: asStringArray(payload.social_channels),
    aspect_ratios: asStringArray(payload.aspect_ratios),
    additional_notes: asString(payload.additional_notes),
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
 * Large files become download links; smaller ones are listed (and attached via Resend path).
 */
function buildEmailHtml(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: BriefAttachmentMeta[],
  linkedOnly: BriefAttachmentMeta[],
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

  const linkedIds = new Set(linkedOnly.map((f) => f.assetId));
  let filesHtml: string;
  if (files.length === 0) {
    filesHtml = '—';
  } else {
    filesHtml = files
      .map((f) => {
        const safeName = escapeHtml(f.filename);
        const href = escapeHtml(f.cdnUrl);
        if (linkedIds.has(f.assetId)) {
          const sizeLabel = formatFileSizeMb(f.size);
          return `<a href="${href}">${safeName}</a> (${sizeLabel} — too large to attach, download here)`;
        }
        return escapeHtml(f.filename);
      })
      .join('<br>');
  }

  const fileRow = emailRow('Upload Files', filesHtml);
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
  files: BriefAttachmentMeta[],
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('Email service is not configured.');
  }

  const { toAttach, toLink } = partitionResendAttachments(files);
  const resend = new Resend(apiKey);
  const campaignTitle = String(fields.campaign_title);
  const companyName = String(fields.company_name);

  // TODO: verify domain in Resend before production — sender must use verified vantage.pictures domain.
  // Attach via remote `path` (CDN URL) — supported by resend@6.x Attachment.path.
  const { error } = await resend.emails.send({
    from,
    to: BRIEF_RECIPIENT,
    subject: `New Campaign Brief: ${campaignTitle} — ${companyName}`,
    html: buildEmailHtml(fields, files, toLink),
    attachments: toAttach.map((f) => ({
      filename: f.filename,
      path: f.cdnUrl,
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
  filesReceivedLabel: string;
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
    filesReceivedLabel: 'Files received:',
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
    filesReceivedLabel: '已收到的文件：',
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
  files: BriefAttachmentMeta[],
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
    files.length > 0
      ? `<p style="margin:24px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#333;line-height:1.5;">${escapeHtml(copy.filesReceivedLabel)} ${files
          .map(
            (f) =>
              `<a href="${escapeHtml(f.cdnUrl)}" style="color:#111;text-decoration:underline;">${escapeHtml(f.filename)}</a>`,
          )
          .join(', ')}</p>`
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
  files: BriefAttachmentMeta[],
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
    html: buildConfirmationEmailHtml(locale, fields, files),
  });

  if (error) throw new Error(error.message);
}

function formatLarkAttachments(files: BriefAttachmentMeta[]): string {
  if (files.length === 0) return 'No files attached';

  const lines = files.map((f) => `• [${f.filename}](${f.cdnUrl})`);

  return `${files.length} file${files.length === 1 ? '' : 's'} attached — see email for downloads:\n${lines.join('\n')}`;
}

/**
 * Best-effort: create one campaignBriefAttachment doc referencing already-uploaded assets.
 * Uses SANITY_API_WRITE_TOKEN (server-only) — files were uploaded via the browser token.
 */
async function createCampaignBriefAttachmentDoc(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: BriefAttachmentMeta[],
): Promise<void> {
  if (files.length === 0) return;

  const client = getSanityWriteClient();
  await client.create({
    _type: 'campaignBriefAttachment',
    companyName: String(fields.company_name),
    campaignTitle: String(fields.campaign_title),
    contactEmail: String(fields.contact_email),
    campaignType: String(fields.campaign_type),
    files: files.map((file) => ({
      _key: randomUUID().replace(/-/g, '').slice(0, 12),
      _type: 'briefFile',
      originalFilename: file.filename,
      file: {
        _type: 'file',
        asset: {
          _type: 'reference',
          _ref: file.assetId,
        },
      },
    })),
  });
}

/** Free-text fields rendered as full-width Lark blocks (not the 2-col grid). */
const LARK_LONG_TEXT_FIELDS = new Set<CampaignBriefFieldKey>([
  'brand_description',
  'product_description',
  'campaign_description',
  'project_description',
]);

/** Already shown in the Lark header — omit from Campaign Details. */
const LARK_HEADER_FIELD_KEYS = new Set<CampaignBriefFieldKey>([
  'campaign_title',
  'campaign_type',
  'budget_range',
]);

async function sendLarkNotification(
  fields: Record<CampaignBriefFieldKey, string | string[]>,
  files: BriefAttachmentMeta[],
): Promise<void> {
  const webhookUrl = process.env.LARK_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('Lark webhook is not configured.');

  const contactName = `${fields.contact_name_first} ${fields.contact_name_last}`.trim();
  const campaignType = String(fields.campaign_type).trim() || '—';
  const fileNote = formatLarkAttachments(files);

  const isEmptyFieldValue = (value: string | string[] | undefined): boolean => {
    if (value == null) return true;
    if (Array.isArray(value)) return value.length === 0;
    return !String(value).trim();
  };

  /** Plain-text value for Lark (no HTML escaping). */
  const larkPlainValue = (value: string | string[]): string => {
    if (Array.isArray(value)) return value.join(', ');
    return String(value).trim();
  };

  const larkDateDisplay = (
    dateKey: 'delivery_deadline' | 'shoot_event_date',
  ): string => {
    const unknownKey =
      dateKey === 'delivery_deadline'
        ? 'delivery_deadline_unknown'
        : 'shoot_event_date_unknown';
    const noteKey =
      dateKey === 'delivery_deadline' ? 'delivery_deadline_note' : 'shoot_event_date_note';

    if (String(fields[unknownKey]) === 'true') {
      const note = String(fields[noteKey] ?? '').trim();
      return note ? `No specific date yet — ${note}` : 'No specific date yet';
    }

    const dateVal = fields[dateKey];
    if (isEmptyFieldValue(dateVal)) return '';
    return larkPlainValue(dateVal as string | string[]);
  };

  let campaignKeys = emailFieldsForCampaignType(String(fields.campaign_type));
  if (
    String(fields.campaign_type) === 'Documentary / Live Event' &&
    String(fields.production_scope) !== 'Filming + post-production'
  ) {
    campaignKeys = campaignKeys.filter((key) => key !== 'delivery_deadline');
  }

  const shortFieldElements: Array<{
    is_short: true;
    text: { tag: 'lark_md'; content: string };
  }> = [];
  const longFieldElements: Array<{
    tag: 'div';
    text: { tag: 'lark_md'; content: string };
  }> = [];

  for (const key of campaignKeys) {
    if (LARK_HEADER_FIELD_KEYS.has(key)) continue;

    if (
      key === 'extra_deliverables_other_note' &&
      !(Array.isArray(fields.extra_deliverables) && fields.extra_deliverables.includes('Other'))
    ) {
      continue;
    }

    let display = '';
    if (key === 'delivery_deadline' || key === 'shoot_event_date') {
      display = larkDateDisplay(key);
    } else if (isEmptyFieldValue(fields[key])) {
      continue;
    } else {
      display = larkPlainValue(fields[key] as string | string[]);
    }

    if (!display) continue;

    const label = CAMPAIGN_BRIEF_FIELD_LABELS[key];
    const content = `**${label}**\n${display}`;

    if (LARK_LONG_TEXT_FIELDS.has(key)) {
      longFieldElements.push({
        tag: 'div',
        text: { tag: 'lark_md', content },
      });
    } else {
      shortFieldElements.push({
        is_short: true,
        text: { tag: 'lark_md', content },
      });
    }
  }

  const campaignDetailsElements: unknown[] = [];
  if (shortFieldElements.length > 0 || longFieldElements.length > 0) {
    campaignDetailsElements.push({
      tag: 'div',
      text: { tag: 'lark_md', content: '**Campaign Details**' },
    });
    if (shortFieldElements.length > 0) {
      campaignDetailsElements.push({
        tag: 'div',
        fields: shortFieldElements,
      });
    }
    campaignDetailsElements.push(...longFieldElements);
  }

  const additionalNotes = String(fields.additional_notes ?? '').trim();
  const additionalNotesElements =
    additionalNotes.length > 0
      ? [
          {
            tag: 'div' as const,
            text: {
              tag: 'lark_md' as const,
              content: `**Additional Notes**\n${additionalNotes}`,
            },
          },
        ]
      : [];

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
      ...campaignDetailsElements,
      ...additionalNotesElements,
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
    const payload = (await request.json()) as BriefSubmitPayload;
    locale = resolveLocale(payload);

    // Honeypot — silently accept but discard if populated.
    if (asString(payload.website)) {
      return NextResponse.json({ success: true });
    }

    // Speed check — silently accept if submitted too fast.
    const elapsed = Number(payload._form_elapsed_ms);
    if (!Number.isNaN(elapsed) && elapsed < MIN_SUBMIT_MS) {
      return NextResponse.json({ success: true });
    }

    const fields = parseFields(payload);
    const fieldErrors = validateFields(fields, locale);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ success: false, errors: fieldErrors }, { status: 400 });
    }

    const { files, error: fileError } = parseAttachments(payload.attachments, locale);
    if (fileError) {
      return NextResponse.json(
        { success: false, errors: { files: fileError } },
        { status: 400 },
      );
    }

    // Best-effort: create campaignBriefAttachment from client-uploaded asset refs.
    // Assets already exist in Sanity; doc creation failure must not block notifications.
    if (files.length > 0) {
      try {
        await createCampaignBriefAttachmentDoc(fields, files);
      } catch (err) {
        console.error(
          `Campaign brief attachment doc failed for ${String(fields.contact_email)}:`,
          err,
        );
      }
    }

    await Promise.all([
      sendResendEmail(fields, files),
      sendLarkNotification(fields, files),
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
