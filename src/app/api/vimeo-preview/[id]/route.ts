/**
 * Mint a short-lived Vimeo progressive MP4 URL for the carousel prototype.
 * Reads VIMEO_ACCESS_TOKEN server-side only — never forwarded to the client.
 */

import {NextResponse} from 'next/server';
import {
  isVimeoVideoId,
  pickProgressiveRendition,
  VIMEO_PREVIEW_CACHE_SECONDS,
  type VimeoProgressiveFile,
} from '@/lib/vimeo-preview';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{id: string}>;
};

type VimeoPlayResponse = {
  play?: {
    progressive?: VimeoProgressiveFile[];
    status?: string;
  };
  error?: string;
};

function errorJson(status: number, error: string, message: string) {
  return NextResponse.json({error, message}, {status});
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

  try {
    const vimeoRes = await fetch(
      `https://api.vimeo.com/videos/${id}?fields=play.progressive`,
      {
        headers: {
          Authorization: `bearer ${token}`,
          Accept: 'application/vnd.vimeo.*+json;version=3.4',
        },
        next: {revalidate: VIMEO_PREVIEW_CACHE_SECONDS},
      },
    );

    if (vimeoRes.status === 404) {
      return errorJson(404, 'not_found', 'That Vimeo video was not found.');
    }
    if (vimeoRes.status === 429) {
      return errorJson(429, 'rate_limited', 'Vimeo rate limit reached. Try again shortly.');
    }
    if (!vimeoRes.ok) {
      return errorJson(502, 'vimeo_error', 'Vimeo did not return a playable file.');
    }

    const body = (await vimeoRes.json()) as VimeoPlayResponse;
    const picked = pickProgressiveRendition(body.play?.progressive);
    if (!picked) {
      return errorJson(502, 'no_progressive', 'No progressive MP4 rendition is available.');
    }

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
  } catch {
    return errorJson(502, 'vimeo_error', 'Could not reach Vimeo.');
  }
}
