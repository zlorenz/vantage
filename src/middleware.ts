/**
 * next-intl middleware — locale routing (no automatic locale detection).
 *
 * English routes have no prefix; Chinese routes are prefixed with /zh/.
 * localeDetection is disabled in routing.ts — / always serves English unless
 * the user navigates to /zh/ or uses the language switcher.
 * API routes, static files, and Next.js internals are excluded.
 */

import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
