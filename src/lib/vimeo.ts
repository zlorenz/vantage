import {extractVimeoId, vimeoThumbnailUrl} from '@video-url'

export {extractVimeoId, vimeoThumbnailUrl};

/** Cache Vimeo still URLs — picture assets change rarely. */
const VIMEO_THUMB_REVALIDATE_SECONDS = 86400;

/** Cap upstream Vimeo API/oEmbed latency during RSC render (prevents 503 timeouts). */
const VIMEO_THUMB_FETCH_TIMEOUT_MS = 2500;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & {next?: {revalidate?: number}},
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {...init, signal: controller.signal});
  } finally {
    clearTimeout(timer);
  }
}

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
 * Rewrite a Vimeo CDN still to the largest common preset (1920).
 * Vimeo does not upscale — missing tiers fall back to the max available.
 */
export function upscaleVimeoCdnThumbnail(url: string): string {
  const withPair = url.replace(/_\d+x\d+(?=\.\w+(?:\?|$))/, '_1920x1080');
  if (withPair !== url) return withPair;
  return url.replace(/_\d+(?=\.\w+(?:\?|$))/, '_1920');
}

type VimeoPicturesResponse = {
  pictures?: {sizes?: Array<{width?: number; link?: string}>};
};

/**
 * Highest-resolution Vimeo still for a video.
 * Prefers authenticated `pictures.sizes` (works for team/unlisted), then
 * oEmbed + CDN upscale, then the public vumbnail fallback.
 */
export async function fetchHighestVimeoThumbnailUrl(
  urlOrId: string,
): Promise<string | null> {
  const id = /^\d+$/.test(urlOrId) ? urlOrId : extractVimeoId(urlOrId);
  if (!id) return null;

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (token) {
    try {
      const res = await fetchWithTimeout(
        `https://api.vimeo.com/videos/${id}?fields=pictures.sizes`,
        {
          headers: {
            Authorization: `bearer ${token}`,
            Accept: 'application/vnd.vimeo.*+json;version=3.4',
          },
          next: {revalidate: VIMEO_THUMB_REVALIDATE_SECONDS},
        },
        VIMEO_THUMB_FETCH_TIMEOUT_MS,
      );
      if (res.ok) {
        const body = (await res.json()) as VimeoPicturesResponse;
        const sizes = (body.pictures?.sizes ?? []).filter(
          (size): size is {width: number; link: string} =>
            typeof size.width === 'number' &&
            typeof size.link === 'string' &&
            size.link.startsWith('http'),
        );
        if (sizes.length > 0) {
          const best = [...sizes].sort((a, b) => b.width - a.width)[0];
          return best.link;
        }
      }
    } catch {
      // fall through to oEmbed / vumbnail
    }
  }

  try {
    const oembedTarget = /^\d+$/.test(urlOrId)
      ? `https://vimeo.com/${urlOrId}`
      : urlOrId;
    const res = await fetchWithTimeout(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(oembedTarget)}`,
      {next: {revalidate: VIMEO_THUMB_REVALIDATE_SECONDS}},
      VIMEO_THUMB_FETCH_TIMEOUT_MS,
    );
    if (res.ok) {
      const data = (await res.json()) as {thumbnail_url?: string};
      if (typeof data.thumbnail_url === 'string' && data.thumbnail_url) {
        return upscaleVimeoCdnThumbnail(data.thumbnail_url);
      }
    }
  } catch {
    // fall through
  }

  return vimeoThumbnailUrl(urlOrId);
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
