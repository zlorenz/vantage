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
  loadProgressiveRendition,
  VIMEO_PREVIEW_CACHE_SECONDS,
  type PickedProgressive,
} from '@/lib/vimeo-preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{id: string}>;
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
    const loaded = await loadProgressiveRendition(id, token);
    if (!loaded.ok) {
      return errorJson(loaded.status, loaded.error, loaded.message);
    }

    successCache.set(id, {
      picked: loaded.picked,
      until: Date.now() + VIMEO_PREVIEW_CACHE_SECONDS * 1000,
    });

    return successJson(loaded.picked);
  } catch {
    return errorJson(502, 'vimeo_error', 'Could not reach Vimeo.');
  }
}
