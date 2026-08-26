import {extractVimeoId, vimeoThumbnailUrl} from '@video-url'

export {extractVimeoId, vimeoThumbnailUrl};

/**
 * Privacy hash required for some unlisted/private embeds.
 * Supports `?h=…` and path form `vimeo.com/{id}/{hash}`.
 */
export function extractVimeoPrivacyHash(url: string): string | null {
  try {
    const parsed = new URL(url);
    const fromQuery = parsed.searchParams.get('h');
    if (fromQuery) return fromQuery;
    const pathMatch = parsed.pathname.match(/^\/(?:video\/)?(\d+)\/([a-zA-Z0-9]+)/);
    return pathMatch?.[2] ?? null;
  } catch {
    const queryMatch = url.match(/[?&]h=([a-zA-Z0-9]+)/);
    if (queryMatch?.[1]) return queryMatch[1];
    const pathMatch = url.match(/vimeo\.com\/(?:video\/)?\d+\/([a-zA-Z0-9]+)/);
    return pathMatch?.[1] ?? null;
  }
}

/**
 * Build a player.vimeo.com iframe src. Prefer this over `@vimeo/player` for
 * embeds — the SDK's oEmbed fetch often fails on localhost / restricted domains.
 */
export function vimeoPlayerEmbedSrc(
  urlOrId: string,
  options: {
    autoplay?: boolean;
    /** Pass true for carousel/preview autoplay without a user gesture. */
    muted?: boolean;
    playsinline?: boolean;
    /** Vimeo preload: metadata | auto | none (default metadata_on_hover). */
    preload?: 'metadata' | 'auto' | 'none';
  } = {},
): string | null {
  const id = /^\d+$/.test(urlOrId) ? urlOrId : extractVimeoId(urlOrId);
  if (!id) return null;

  const params = new URLSearchParams();
  if (options.autoplay) {
    params.set('autoplay', '1');
  }
  if (options.muted) {
    params.set('muted', '1');
  }
  if (options.preload) {
    params.set('preload', options.preload);
  }

  // `playsinline=0` asks Vimeo to enter native fullscreen on mobile when playback starts.
  if (options.playsinline === false) {
    params.set('playsinline', '0');
  } else if (options.playsinline === true) {
    params.set('playsinline', '1');
  }

  if (!/^\d+$/.test(urlOrId)) {
    const hash = extractVimeoPrivacyHash(urlOrId);
    if (hash) params.set('h', hash);
  }

  const query = params.toString();
  return `https://player.vimeo.com/video/${id}${query ? `?${query}` : ''}`;
}
