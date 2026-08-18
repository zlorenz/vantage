/**
 * Mint a short-lived Vimeo playback URL for the carousel prototype.
 * Reads VIMEO_ACCESS_TOKEN server-side only — never forwarded to the client.
 *
 * Defaults to a progressive MP4. `?format=hls` mints the HLS manifest
 * instead, for iOS WebKit clients that cannot range-seek progressive MP4.
 * Callers that omit the param get the unchanged progressive behaviour.
 *
 * Vimeo fetches are cache: 'no-store' so an empty/error payload cannot stick
 * for the TTL. Successful picks are memoized in-process for 1 hour.
 */

import {NextResponse} from 'next/server';
import {
  isVimeoVideoId,
  loadHlsRendition,
  loadProgressiveRendition,
  PREFERRED_CAROUSEL_HEIGHT,
  VIMEO_PREVIEW_CACHE_SECONDS,
} from '@/lib/vimeo-preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{id: string}>;
};

type PlaybackPayload = {
  url: string;
  expiresAt: string | null;
  rendition: string;
  width: number | null;
  height: number | null;
};

type CacheHit = {payload: PlaybackPayload; until: number};

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

function successJson(payload: PlaybackPayload) {
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': `public, s-maxage=${VIMEO_PREVIEW_CACHE_SECONDS}, stale-while-revalidate=120`,
    },
  });
}

export async function GET(request: Request, context: RouteContext) {
  const {id} = await context.params;
  if (!isVimeoVideoId(id)) {
    return errorJson(400, 'invalid_id', 'A numeric Vimeo video ID is required.');
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    return errorJson(503, 'unconfigured', 'Vimeo preview is not configured.');
  }

  const wantsHls = new URL(request.url).searchParams.get('format') === 'hls';

  const cacheKey = wantsHls ? `${id}:hls` : `${id}:${PREFERRED_CAROUSEL_HEIGHT}`;
  const cached = successCache.get(cacheKey);
  if (cached && cached.until > Date.now()) {
    return successJson(cached.payload);
  }

  try {
    let payload: PlaybackPayload;

    if (wantsHls) {
      const loaded = await loadHlsRendition(id, token);
      if (!loaded.ok) {
        return errorJson(loaded.status, loaded.error, loaded.message);
      }
      payload = {
        url: loaded.picked.url,
        expiresAt: loaded.picked.expiresAt,
        rendition: 'hls',
        width: null,
        height: null,
      };
    } else {
      const loaded = await loadProgressiveRendition(id, token, PREFERRED_CAROUSEL_HEIGHT);
      if (!loaded.ok) {
        return errorJson(loaded.status, loaded.error, loaded.message);
      }
      payload = {
        url: loaded.picked.url,
        expiresAt: loaded.picked.expiresAt,
        rendition: loaded.picked.rendition,
        width: loaded.picked.width,
        height: loaded.picked.height,
      };
    }

    successCache.set(cacheKey, {
      payload,
      until: Date.now() + VIMEO_PREVIEW_CACHE_SECONDS * 1000,
    });

    return successJson(payload);
  } catch {
    return errorJson(502, 'vimeo_error', 'Could not reach Vimeo.');
  }
}
