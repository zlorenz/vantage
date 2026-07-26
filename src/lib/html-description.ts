/**
 * Convert legacy HTML descriptions to plain text with paragraph breaks.
 * Used by migration patches and frontend fallback for unmigrated rows.
 */

export function htmlDescriptionToPlain(html: string | null | undefined): string {
  if (html == null) return ''
  let text = String(html)
  if (!text.trim()) return ''

  // Paragraph / break structure → newlines before stripping tags.
  text = text
    .replace(/\r\n?/g, '\n')
    .replace(/<\/p>\s*<p\b[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n\n')
    .replace(/<(p|div|h[1-6]|li|tr)\b[^>]*>/gi, '')

  text = text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\u00a0/g, ' ')

  // Collapse spaces within lines; keep paragraph breaks.
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t\f\v]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
}

export function hasHtmlMarkup(value: string | null | undefined): boolean {
  if (!value) return false
  return /<[^>]+>|&nbsp;|&amp;|&lt;|&gt;/i.test(value)
}
