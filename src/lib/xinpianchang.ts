/**
 * Validate and normalise Xinpianchang player embed URLs.
 * Requires player.xinpianchang.com with both aid= and mid= query params.
 */
export function xinpianchangToEmbedUrl(url: string): string | null {
  // Some CMS values store HTML-encoded ampersands (&amp;) which break mid=.
  const trimmed = url.replace(/&amp;/gi, '&').trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname !== 'player.xinpianchang.com') return null;
    const query = parsed.search.slice(1);
    if (!query.includes('aid=') || !query.includes('mid=')) return null;
    return `https://player.xinpianchang.com/?${query}`;
  } catch {
    return null;
  }
}
