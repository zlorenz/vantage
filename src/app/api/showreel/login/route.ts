/**
 * Showreel editor login — shared password → signed httpOnly session cookie.
 *
 * v1: no rate-limiting / lockout on failed attempts (small trusted team,
 * accepted risk — not an oversight). Revisit before wider exposure.
 */

import {NextResponse, type NextRequest} from 'next/server'
import {
  SHOWREEL_AUTH_COOKIE,
  createShowreelSessionValue,
  showreelAuthCookieOptions,
  verifyShowreelPassword,
} from '@/lib/showreel-auth-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let password = ''
  try {
    const body = (await request.json()) as {password?: unknown}
    if (typeof body.password === 'string') password = body.password
  } catch {
    return NextResponse.json({error: 'Invalid JSON body'}, {status: 400})
  }

  if (!process.env.SHOWREEL_EDITOR_PASSWORD?.trim()) {
    console.error('[showreel-auth] SHOWREEL_EDITOR_PASSWORD is not configured')
    return NextResponse.json(
      {error: 'Showreel editor auth is not configured'},
      {status: 503},
    )
  }

  // No lockout / rate-limit in v1 — intentional for a small trusted team.
  if (!verifyShowreelPassword(password)) {
    return NextResponse.json({error: 'Incorrect password'}, {status: 401})
  }

  const response = NextResponse.json({success: true})
  response.cookies.set(
    SHOWREEL_AUTH_COOKIE,
    createShowreelSessionValue(),
    showreelAuthCookieOptions(),
  )
  return response
}
