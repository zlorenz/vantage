/**
 * Showreel auth helpers for App Router (API routes + Server Components).
 *
 * Cookie crypto: `showreel-auth-session.ts`. Path helpers: `showreel-auth-paths.ts`.
 *
 * v1 intentionally has no login rate-limiting / lockout — small trusted team,
 * accepted risk (not an oversight). Revisit before broader exposure.
 */

import {cookies} from 'next/headers'
import {NextResponse, type NextRequest} from 'next/server'
import {
  requestHasShowreelAuth,
  verifyShowreelSessionValue,
  SHOWREEL_AUTH_COOKIE,
} from './showreel-auth-session'

export {
  SHOWREEL_AUTH_COOKIE,
  SHOWREEL_AUTH_MAX_AGE_SEC,
  createShowreelSessionValue,
  requestHasShowreelAuth,
  showreelAuthCookieOptions,
  verifyShowreelPassword,
  verifyShowreelSessionValue,
} from './showreel-auth-session'

export {
  isShowreelEditPath,
  safeShowreelNextPath,
  showreelLoginPathFor,
} from './showreel-auth-paths'

/**
 * For Route Handlers that mutate showreels.
 * Returns null when authorized; otherwise a 401 JSON response.
 */
export function requireShowreelAuth(request: NextRequest): NextResponse | null {
  if (requestHasShowreelAuth(request)) return null
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

/** Server Components / Server Actions — read cookie from next/headers. */
export async function hasShowreelAuthFromCookies(): Promise<boolean> {
  const jar = await cookies()
  return verifyShowreelSessionValue(jar.get(SHOWREEL_AUTH_COOKIE)?.value)
}
