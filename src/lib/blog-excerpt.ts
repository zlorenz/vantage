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
 * Prefer the first meaningful paragraph(s) of body plain-text for cards,
 * omitting lines that were only embed URLs.
 */
export function blogCardExcerpt(raw: string | undefined | null): string {
  if (!raw) return '';

  const paragraphs = raw
    .split(/\n+/)
    .map((p) => stripExcerptUrls(p))
    .filter((p) => p.length > 0);

  if (!paragraphs.length) return '';

  // Lead + optional following sentence block, enough for line-clamp-3
  return paragraphs.slice(0, 2).join(' ');
}
