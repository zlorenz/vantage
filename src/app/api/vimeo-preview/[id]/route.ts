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

function isAllowedStudioOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return ['3333', '3000', '3001', ''].includes(url.port);
    }
    if (url.hostname === 'vantage-pictures.sanity.studio') return true;
    if (url.hostname.endsWith('.sanity.studio')) return true;
    if (url.hostname === 'vantage.pictures' || url.hostname === 'www.vantage.pictures') {
      return true;
    }
    if (url.hostname.endsWith('.vercel.app') && url.hostname.includes('vantage')) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') ?? '';
  const allowed = origin && isAllowedStudioOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

type PlaybackPayload = {
  url: string;
  expiresAt: string | null;
  rendition: string;
  width: number | null;
  height: number | null;
};

type CacheHit = {payload: PlaybackPayload; until: number};

const successCache = new Map<string, CacheHit>();

function errorJson(request: Request, status: number, error: string, message: string) {
  return NextResponse.json(
    {error, message},
    {
      status,
      headers: {...corsHeaders(request), 'Cache-Control': 'no-store'},
    },
  );
}

function successJson(request: Request, payload: PlaybackPayload) {
  return NextResponse.json(payload, {
    headers: {
      ...corsHeaders(request),
      'Cache-Control': `public, s-maxage=${VIMEO_PREVIEW_CACHE_SECONDS}, stale-while-revalidate=120`,
    },
  });
}

export function OPTIONS(request: Request) {
  return new NextResponse(null, {status: 204, headers: corsHeaders(request)});
}

export async function GET(request: Request, context: RouteContext) {
  const {id} = await context.params;
  if (!isVimeoVideoId(id)) {
    return errorJson(request, 400, 'invalid_id', 'A numeric Vimeo video ID is required.');
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    return errorJson(request, 503, 'unconfigured', 'Vimeo preview is not configured.');
  }

  const wantsHls = new URL(request.url).searchParams.get('format') === 'hls';

  const cacheKey = wantsHls ? `${id}:hls` : `${id}:${PREFERRED_CAROUSEL_HEIGHT}`;
  const cached = successCache.get(cacheKey);
  if (cached && cached.until > Date.now()) {
    return successJson(request, cached.payload);
  }

  try {
    let payload: PlaybackPayload;

    if (wantsHls) {
      const loaded = await loadHlsRendition(id, token);
      if (!loaded.ok) {
        return errorJson(request, loaded.status, loaded.error, loaded.message);
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
        return errorJson(request, loaded.status, loaded.error, loaded.message);
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

    return successJson(request, payload);
  } catch {
    return errorJson(request, 502, 'vimeo_error', 'Could not reach Vimeo.');
  }
}
