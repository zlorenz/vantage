/**
 * Pick a progressive MP4 from Vimeo's play.progressive list.
 * Used by /api/vimeo-preview/[id] so carousel slides can play a native <video>.
 */

export const PREFERRED_PREVIEW_HEIGHT = 720;

/** Cache minted playback URLs well under Vimeo's ~24h play-link expiry. */
export const VIMEO_PREVIEW_CACHE_SECONDS = 3600;

export type VimeoProgressiveFile = {
  rendition?: string | null;
  width?: number | null;
  height?: number | null;
  link?: string | null;
  link_expiration_time?: string | null;
  type?: string | null;
  codec?: string | null;
};

export type PickedProgressive = {
  url: string;
  expiresAt: string | null;
  rendition: string;
  width: number | null;
  height: number | null;
};

function heightOf(file: VimeoProgressiveFile): number {
  if (typeof file.height === 'number' && file.height > 0) return file.height;
  const fromRendition = String(file.rendition ?? '').match(/^(\d+)p$/i);
  if (fromRendition) return Number(fromRendition[1]);
  return 0;
}

function hasLink(file: VimeoProgressiveFile): file is VimeoProgressiveFile & {link: string} {
  return typeof file.link === 'string' && file.link.startsWith('http');
}

/**
 * Prefer 720p H264 MP4. If that rendition is missing, take the highest
 * remaining progressive file that still has a playback link.
 */
export function pickProgressiveRendition(
  files: VimeoProgressiveFile[] | null | undefined,
  preferredHeight: number = PREFERRED_PREVIEW_HEIGHT,
): PickedProgressive | null {
  const linked = (files ?? []).filter(hasLink);
  if (!linked.length) return null;

  const preferred =
    linked.find((file) => heightOf(file) === preferredHeight) ??
    linked.find((file) => String(file.rendition).toLowerCase() === `${preferredHeight}p`);

  const chosen =
    preferred ??
    [...linked].sort((a, b) => heightOf(b) - heightOf(a))[0];

  if (!chosen) return null;

  return {
    url: chosen.link,
    expiresAt: chosen.link_expiration_time ?? null,
    rendition: chosen.rendition ?? (heightOf(chosen) ? `${heightOf(chosen)}p` : 'unknown'),
    width: typeof chosen.width === 'number' ? chosen.width : null,
    height: typeof chosen.height === 'number' ? chosen.height : heightOf(chosen) || null,
  };
}

export function isVimeoVideoId(id: string): boolean {
  return /^\d+$/.test(id);
}

export type VimeoPlayResponse = {
  play?:
    | {
        progressive?: VimeoProgressiveFile[];
        status?: string;
      }
    | VimeoProgressiveFile[];
  error?: string;
};

export type ProgressiveLoadResult =
  | {ok: true; picked: PickedProgressive}
  | {ok: false; status: number; error: string; message: string};

export function progressiveFiles(body: VimeoPlayResponse): VimeoProgressiveFile[] {
  const play = body.play;
  if (Array.isArray(play)) return play;
  if (play && Array.isArray(play.progressive)) return play.progressive;
  return [];
}

export async function fetchPlayProgressive(id: string, token: string): Promise<Response> {
  return fetch(`https://api.vimeo.com/videos/${id}?fields=play.progressive`, {
    headers: {
      Authorization: `bearer ${token}`,
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
    cache: 'no-store',
  });
}

/**
 * Mint a 720p-preferred progressive MP4. Retries once when Vimeo returns an
 * empty progressive list (transient under concurrent carousel mints).
 */
export async function loadProgressiveRendition(
  id: string,
  token: string,
): Promise<ProgressiveLoadResult> {
  const first = await fetchPlayProgressive(id, token);
  if (first.status === 404) {
    return {ok: false, status: 404, error: 'not_found', message: 'That Vimeo video was not found.'};
  }
  if (first.status === 429) {
    return {
      ok: false,
      status: 429,
      error: 'rate_limited',
      message: 'Vimeo rate limit reached. Try again shortly.',
    };
  }
  if (!first.ok) {
    return {
      ok: false,
      status: 502,
      error: 'vimeo_error',
      message: 'Vimeo did not return a playable file.',
    };
  }

  let body = (await first.json()) as VimeoPlayResponse;
  let picked = pickProgressiveRendition(progressiveFiles(body));
  if (!picked) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const retry = await fetchPlayProgressive(id, token);
    if (retry.ok) {
      body = (await retry.json()) as VimeoPlayResponse;
      picked = pickProgressiveRendition(progressiveFiles(body));
    }
  }
  if (!picked) {
    return {
      ok: false,
      status: 502,
      error: 'no_progressive',
      message: 'No progressive MP4 rendition is available.',
    };
  }
  return {ok: true, picked};
}
