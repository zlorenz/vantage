/**
 * Showreel session cookie crypto (Node). Safe to import from proxy.ts.
 *
 * v1 intentionally has no login rate-limiting / lockout — small trusted team,
 * accepted risk (not an oversight). Revisit before broader exposure.
 */

import {createHmac, timingSafeEqual} from 'node:crypto'
import type {NextRequest} from 'next/server'

export const SHOWREEL_AUTH_COOKIE = 'vp_showreel_editor'

/** 30 days — producers should stay signed in for weeks. */
export const SHOWREEL_AUTH_MAX_AGE_SEC = 30 * 24 * 60 * 60

function getEditorPassword(): string | null {
  const value = process.env.SHOWREEL_EDITOR_PASSWORD
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function hmacSign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function safeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

/** Timing-safe password check against SHOWREEL_EDITOR_PASSWORD. */
export function verifyShowreelPassword(input: string): boolean {
  const expected = getEditorPassword()
  if (!expected) return false
  return safeEqualString(input, expected)
}

/** Build signed cookie value: `v1.<expMs>.<hmac>`. */
export function createShowreelSessionValue(): string {
  const secret = getEditorPassword()
  if (!secret) {
    throw new Error('SHOWREEL_EDITOR_PASSWORD is not configured')
  }
  const exp = Date.now() + SHOWREEL_AUTH_MAX_AGE_SEC * 1000
  const payload = `v1.${exp}`
  return `${payload}.${hmacSign(payload, secret)}`
}

/** Validate a cookie value (signature + expiry). */
export function verifyShowreelSessionValue(
  value: string | undefined | null,
): boolean {
  if (!value) return false
  const secret = getEditorPassword()
  if (!secret) return false

  const parts = value.split('.')
  if (parts.length !== 3) return false
  const [version, expStr, signature] = parts
  if (version !== 'v1' || !expStr || !signature) return false

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return false

  const payload = `${version}.${expStr}`
  const expected = hmacSign(payload, secret)
  return safeEqualString(signature, expected)
}

export function requestHasShowreelAuth(request: NextRequest): boolean {
  return verifyShowreelSessionValue(
    request.cookies.get(SHOWREEL_AUTH_COOKIE)?.value,
  )
}

export function showreelAuthCookieOptions(): {
  httpOnly: true
  secure: boolean
  sameSite: 'lax'
  path: '/'
  maxAge: number
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SHOWREEL_AUTH_MAX_AGE_SEC,
  }
}
