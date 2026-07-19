/**
 * Extract numeric Vimeo video ID from a Vimeo URL string.
 */
export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] ?? null;
}

/**
 * Public Vimeo still URL (no oEmbed — Vimeo’s API is often blocked from servers).
 * Used for additional portfolio embeds so each row shows its own frame.
 */
export function vimeoThumbnailUrl(urlOrId: string): string | null {
  const id = /^\d+$/.test(urlOrId) ? urlOrId : extractVimeoId(urlOrId);
  if (!id) return null;
  return `https://vumbnail.com/${id}.jpg`;
}

/** Privacy hash (`h=…`) required for some unlisted/private embeds. */
export function extractVimeoPrivacyHash(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('h');
  } catch {
    const match = url.match(/[?&]h=([a-zA-Z0-9]+)/);
    return match?.[1] ?? null;
  }
}

/**
 * Build a player.vimeo.com iframe src. Prefer this over `@vimeo/player` for
 * embeds — the SDK's oEmbed fetch often fails on localhost / restricted domains.
 */
export function vimeoPlayerEmbedSrc(
  urlOrId: string,
  options: { autoplay?: boolean } = {},
): string | null {
  const id = /^\d+$/.test(urlOrId) ? urlOrId : extractVimeoId(urlOrId);
  if (!id) return null;

  const params = new URLSearchParams();
  if (options.autoplay) params.set('autoplay', '1');

  if (!/^\d+$/.test(urlOrId)) {
    const hash = extractVimeoPrivacyHash(urlOrId);
    if (hash) params.set('h', hash);
  }

  const query = params.toString();
  return `https://player.vimeo.com/video/${id}${query ? `?${query}` : ''}`;
}
