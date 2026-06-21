/**
 * next-intl middleware — locale detection and URL rewriting.
 *
 * English routes have no prefix; Chinese routes are prefixed with /zh/.
 * API routes, static files, and Next.js internals are excluded.
 */

import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
