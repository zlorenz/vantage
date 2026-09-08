/**
 * Showreel auth path helpers — safe for client and server.
 * Cookie/password crypto lives in `showreel-auth.ts` (server-only).
 */

/** `/showreel/:id/edit` and `/zh/showreel/:id/edit` (id ≠ "login"). */
export function isShowreelEditPath(pathname: string): boolean {
  return (
    /^\/showreel\/(?!login(?:\/|$))[^/]+\/edit\/?$/.test(pathname) ||
    /^\/zh\/showreel\/(?!login(?:\/|$))[^/]+\/edit\/?$/.test(pathname)
  )
}

export function showreelLoginPathFor(pathname: string): string {
  return pathname.startsWith('/zh/') ? '/zh/showreel/login' : '/showreel/login'
}

/** Only allow same-origin relative paths as post-login redirects. */
export function safeShowreelNextPath(
  raw: string | null | undefined,
  fallback = '/showreel/login',
): string {
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  if (raw.includes('\\') || raw.includes('\n') || raw.includes('\r')) {
    return fallback
  }
  return raw
}
