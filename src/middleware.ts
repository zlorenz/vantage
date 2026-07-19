/**
 * next-intl middleware — locale routing (no automatic locale detection).
 *
 * English routes have no prefix; Chinese routes are prefixed with /zh/.
 * localeDetection is disabled in routing.ts — / always serves English unless
 * the user navigates to /zh/ or uses the language switcher.
 * API routes, static files, and Next.js internals are excluded.
 *
 * Also normalizes literal ":" in pathnames. Next.js `redirects()` uses
 * path-to-regexp, which treats ":" as a named-parameter marker, so colon
 * slugs cannot be expressed there — middleware 301s them to hyphen form.
 */

import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

import { routing } from './i18n/routing';

const handleI18n = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.includes(':')) {
    const normalized = pathname.replace(/:/g, '-');
    if (normalized !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = normalized;
      return NextResponse.redirect(url, 301);
    }
  }
  return handleI18n(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
