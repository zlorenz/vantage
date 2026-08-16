/**
 * Mint a short-lived Vimeo progressive MP4 URL for the carousel prototype.
 * Reads VIMEO_ACCESS_TOKEN server-side only — never forwarded to the client.
 *
 * Vimeo fetches are cache: 'no-store' so an empty/error payload cannot stick
 * for the TTL. Successful picks are memoized in-process for 1 hour.
 */

import {NextResponse} from 'next/server';
import {
  isVimeoVideoId,
  pickProgressiveRendition,
  VIMEO_PREVIEW_CACHE_SECONDS,
  type PickedProgressive,
  type VimeoProgressiveFile,
} from '@/lib/vimeo-preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{id: string}>;
};

type VimeoPlayResponse = {
  play?:
    | {
        progressive?: VimeoProgressiveFile[];
        status?: string;
      }
    | VimeoProgressiveFile[];
  error?: string;
};

type CacheHit = {picked: PickedProgressive; until: number};

const successCache = new Map<string, CacheHit>();

function errorJson(status: number, error: string, message: string) {
  return NextResponse.json(
    {error, message},
    {
      status,
      headers: {'Cache-Control': 'no-store'},
    },
  );
}

function successJson(picked: PickedProgressive) {
  return NextResponse.json(
    {
      url: picked.url,
      expiresAt: picked.expiresAt,
      rendition: picked.rendition,
      width: picked.width,
      height: picked.height,
    },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${VIMEO_PREVIEW_CACHE_SECONDS}, stale-while-revalidate=120`,
      },
    },
  );
}

function progressiveFiles(body: VimeoPlayResponse): VimeoProgressiveFile[] {
  const play = body.play;
  if (Array.isArray(play)) return play;
  if (play && Array.isArray(play.progressive)) return play.progressive;
  return [];
}

async function fetchPlayProgressive(id: string, token: string) {
  return fetch(`https://api.vimeo.com/videos/${id}?fields=play.progressive`, {
    headers: {
      Authorization: `bearer ${token}`,
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
    cache: 'no-store',
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const {id} = await context.params;
  if (!isVimeoVideoId(id)) {
    return errorJson(400, 'invalid_id', 'A numeric Vimeo video ID is required.');
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    return errorJson(503, 'unconfigured', 'Vimeo preview is not configured.');
  }

  const cached = successCache.get(id);
  if (cached && cached.until > Date.now()) {
    return successJson(cached.picked);
  }

  try {
    const vimeoRes = await fetchPlayProgressive(id, token);

    if (vimeoRes.status === 404) {
      return errorJson(404, 'not_found', 'That Vimeo video was not found.');
    }
    if (vimeoRes.status === 429) {
      return errorJson(429, 'rate_limited', 'Vimeo rate limit reached. Try again shortly.');
    }
    if (!vimeoRes.ok) {
      return errorJson(502, 'vimeo_error', 'Vimeo did not return a playable file.');
    }

    let body = (await vimeoRes.json()) as VimeoPlayResponse;
    let picked = pickProgressiveRendition(progressiveFiles(body));
    // A burst of carousel mints can briefly return an empty progressive list
    // even when the video is playable — retry once before falling back.
    if (!picked) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const retryRes = await fetchPlayProgressive(id, token);
      if (retryRes.ok) {
        body = (await retryRes.json()) as VimeoPlayResponse;
        picked = pickProgressiveRendition(progressiveFiles(body));
      }
    }
    if (!picked) {
      return errorJson(502, 'no_progressive', 'No progressive MP4 rendition is available.');
    }

    successCache.set(id, {
      picked,
      until: Date.now() + VIMEO_PREVIEW_CACHE_SECONDS * 1000,
    });

    return successJson(picked);
  } catch {
    return errorJson(502, 'vimeo_error', 'Could not reach Vimeo.');
  }
}
