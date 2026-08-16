/**
 * Return H264 keyframe timestamps for a Vimeo progressive MP4.
 * Server-only — VIMEO_ACCESS_TOKEN never leaves this route.
 *
 * Called on demand from the Studio preview-bounds picker. No cache: editors
 * open this field rarely, and a fresh Vimeo read is the right tradeoff.
 */

import {NextResponse} from 'next/server';
import {fetchMoovAtom, keyframeTimestampsFromMoov} from '@/lib/mp4-keyframes';
import {isVimeoVideoId, loadProgressiveRendition} from '@/lib/vimeo-preview';

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
    'Cache-Control': 'no-store',
  };
}

function json(
  request: Request,
  status: number,
  body: {keyframes: number[]; error?: string; message?: string},
) {
  return NextResponse.json(body, {status, headers: corsHeaders(request)});
}

export function OPTIONS(request: Request) {
  return new NextResponse(null, {status: 204, headers: corsHeaders(request)});
}

export async function GET(request: Request, context: RouteContext) {
  const {id} = await context.params;
  if (!isVimeoVideoId(id)) {
    return json(request, 400, {
      keyframes: [],
      error: 'invalid_id',
      message: 'A numeric Vimeo video ID is required.',
    });
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    return json(request, 503, {
      keyframes: [],
      error: 'unconfigured',
      message: 'Vimeo keyframe extraction is not configured.',
    });
  }

  try {
    const loaded = await loadProgressiveRendition(id, token);
    if (!loaded.ok) {
      return json(request, loaded.status, {
        keyframes: [],
        error: loaded.error,
        message: loaded.message,
      });
    }

    const moov = await fetchMoovAtom(loaded.picked.url);
    const keyframes = keyframeTimestampsFromMoov(moov);
    if (!keyframes.length) {
      return json(request, 502, {
        keyframes: [],
        error: 'no_keyframes',
        message: 'No keyframe table was found in that video.',
      });
    }

    return json(request, 200, {keyframes});
  } catch {
    return json(request, 502, {
      keyframes: [],
      error: 'vimeo_error',
      message: 'Could not read keyframes from Vimeo.',
    });
  }
}
