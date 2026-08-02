/**
 * Blog card excerpt helpers — body plain-text often includes Vimeo/YouTube
 * embed URLs from Portable Text; cards should show clean teaser copy only.
 */

/** Strip media/embed URLs and collapse leftover whitespace. */
export function stripExcerptUrls(text: string): string {
  return text
    .replace(
      /https?:\/\/(?:www\.)?(?:vimeo\.com|player\.vimeo\.com|youtu\.be|youtube\.com)\/\S*/gi,
      ' ',
    )
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate body plain-text for cards when no dedicated excerpt exists.
 * Prefer the first meaningful paragraph(s), omitting embed-only lines.
 */
export function blogCardExcerpt(raw: string | undefined | null): string {
  if (!raw) return '';

  const paragraphs = raw
    .split(/\n+/)
    .map((p) => stripExcerptUrls(p))
    .filter((p) => p.length > 0);

  if (!paragraphs.length) return '';

  // Lead + optional following sentence block — ~2–3 card lines
  return paragraphs.slice(0, 2).join(' ');
}

/**
 * Prefer a stored excerpt verbatim; fall back to truncated body plain-text.
 */
export function resolveBlogCardExcerpt(
  excerpt: string | undefined | null,
  bodyPlainText?: string | null,
): string {
  const trimmed = excerpt?.trim();
  if (trimmed) return trimmed;
  return blogCardExcerpt(bodyPlainText);
}
