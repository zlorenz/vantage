/** Parse and validate a Xinpianchang player URL (aid= + mid= on player.xinpianchang.com). */
function parseXinpianchangPlayerUrl(url: string): URL | null {
  // Some CMS values store HTML-encoded ampersands (&amp;) which break mid=.
  const trimmed = url.replace(/&amp;/gi, '&').trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname !== 'player.xinpianchang.com') return null;
    const query = parsed.search.slice(1);
    if (!query.includes('aid=') || !query.includes('mid=')) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Validate and normalise Xinpianchang player embed URLs.
 * Requires player.xinpianchang.com with both aid= and mid= query params.
 */
export function xinpianchangToEmbedUrl(url: string): string | null {
  const parsed = parseXinpianchangPlayerUrl(url);
  if (!parsed) return null;
  return `https://player.xinpianchang.com/?${parsed.search.slice(1)}`;
}

/** Extract the `mid` query param from a validated Xinpianchang player URL. */
export function extractXinpianchangMid(embedUrl: string): string | null {
  const parsed = parseXinpianchangPlayerUrl(embedUrl);
  if (!parsed) return null;
  const mid = parsed.searchParams.get('mid');
  return mid?.trim() || null;
}
