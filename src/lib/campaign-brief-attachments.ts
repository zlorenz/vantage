/**
 * Shared attachment metadata for campaign brief submissions.
 *
 * Files are uploaded browser → Sanity (NEXT_PUBLIC_SANITY_UPLOAD_TOKEN).
 * The API route only receives this metadata — never raw file bytes.
 */

/** Metadata for one briefing file already stored as a Sanity asset. */
export type BriefAttachmentMeta = {
  filename: string;
  assetId: string;
  cdnUrl: string;
  size: number;
};

/**
 * Resend caps total email size at 40MB after Base64 encoding (~4/3 inflation).
 * ~29MB raw leaves headroom under that cap for a single attachment.
 */
export const RESEND_MAX_EMAIL_BYTES = 40 * 1024 * 1024;
export const RESEND_ATTACH_MAX_RAW_BYTES = 29 * 1024 * 1024;
/** Leave room for HTML body when summing attachment encoded sizes. */
export const RESEND_EMAIL_HTML_HEADROOM_BYTES = 512 * 1024;

export function encodedAttachmentBytes(rawBytes: number): number {
  return Math.ceil(rawBytes * (4 / 3));
}

export function formatFileSizeMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 10) return `${Math.round(mb)}MB`;
  if (mb >= 1) return `${mb.toFixed(1).replace(/\.0$/, '')}MB`;
  const kb = bytes / 1024;
  return kb >= 1 ? `${Math.round(kb)}KB` : `${bytes}B`;
}

/**
 * Decide which files to attach via Resend `path` vs link-only in the email body.
 * Per-file and cumulative encoded budgets must both stay under Resend's 40MB cap.
 */
export function partitionResendAttachments(files: BriefAttachmentMeta[]): {
  toAttach: BriefAttachmentMeta[];
  toLink: BriefAttachmentMeta[];
} {
  const toAttach: BriefAttachmentMeta[] = [];
  const toLink: BriefAttachmentMeta[] = [];
  let encodedUsed = 0;
  const maxEncoded = RESEND_MAX_EMAIL_BYTES - RESEND_EMAIL_HTML_HEADROOM_BYTES;

  for (const file of files) {
    const encoded = encodedAttachmentBytes(file.size);
    const overPerFile = file.size > RESEND_ATTACH_MAX_RAW_BYTES;
    const overBudget = encodedUsed + encoded > maxEncoded;
    if (overPerFile || overBudget) {
      toLink.push(file);
    } else {
      toAttach.push(file);
      encodedUsed += encoded;
    }
  }

  return {toAttach, toLink};
}
