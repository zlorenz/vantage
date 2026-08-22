/**
 * Return the Vantage Pictures Vimeo library for Studio picker.
 * Server-only — VIMEO_ACCESS_TOKEN never leaves this route.
 *
 * Cached via Next.js fetch revalidate (5 min). ?refresh=1 bypasses cache.
 */

import {NextResponse} from 'next/server';

import {loadVimeoLibrary, VIMEO_LIBRARY_REVALIDATE_SECONDS} from '@/lib/vimeo-library';

export const runtime = 'nodejs';

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

function json(
  request: Request,
  status: number,
  body: Record<string, unknown>,
  cacheControl: string,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...corsHeaders(request),
      'Cache-Control': cacheControl,
    },
  });
}

export function OPTIONS(request: Request) {
  return new NextResponse(null, {status: 204, headers: corsHeaders(request)});
}

export async function GET(request: Request) {
  const token = process.env.VIMEO_ACCESS_TOKEN;
  if (!token) {
    return json(
      request,
      503,
      {videos: [], error: 'unconfigured', message: 'Vimeo library is not configured.'},
      'no-store',
    );
  }

  const refresh = new URL(request.url).searchParams.get('refresh') === '1';
  const cacheControl = refresh
    ? 'no-store'
    : `public, s-maxage=${VIMEO_LIBRARY_REVALIDATE_SECONDS}, stale-while-revalidate=60`;

  try {
    const loaded = await loadVimeoLibrary(token, {refresh});
    if (!loaded.ok) {
      return json(
        request,
        loaded.status,
        {videos: [], error: loaded.error, message: loaded.message},
        'no-store',
      );
    }

    return json(
      request,
      200,
      {videos: loaded.videos, total: loaded.total},
      cacheControl,
    );
  } catch {
    return json(
      request,
      502,
      {videos: [], error: 'vimeo_error', message: 'Could not reach Vimeo.'},
      'no-store',
    );
  }
}
