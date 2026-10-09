/**
 * Marketing vs internal-app host helpers.
 *
 * Marketing: vantage.pictures (and www, preview aliases)
 * App:      app.vantage.pictures — work library + showreel editor tools
 *
 * Hostnames come from NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_HOST so
 * hardcoding production domains is avoided in call sites.
 */

function hostnameFromUrl(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    return new URL(withProto).hostname.toLowerCase()
  } catch {
    return null
  }
}

/** Strip port from a Host header value. */
export function hostnameFromHostHeader(host: string | null | undefined): string {
  if (!host) return ''
  return host.split(':')[0]!.trim().toLowerCase()
}

export function getSiteHostname(): string {
  return (
    hostnameFromUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? 'vantage.pictures'
  )
}

export function getAppHostname(): string {
  return (
    hostnameFromUrl(process.env.NEXT_PUBLIC_APP_HOST) ??
    hostnameFromUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    'app.vantage.pictures'
  )
}

/** Absolute marketing origin (no trailing slash). */
export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  return `https://${getSiteHostname()}`
}

/** Absolute app origin (no trailing slash). */
export function getAppOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') ||
    (process.env.NEXT_PUBLIC_APP_HOST
      ? `https://${process.env.NEXT_PUBLIC_APP_HOST.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '')}`
      : null)
  if (fromEnv) return fromEnv
  return `https://${getAppHostname()}`
}

export function isAppHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (!host) return false
  if (host === getAppHostname()) return true
  // Local multi-host convenience (optional /etc/hosts entry).
  if (host === 'app.localhost' || host === 'app.vantage.local') return true
  return false
}

/**
 * First path segments that must not be treated as portfolio library slugs on
 * the app host. Marketing paths redirect to the marketing origin instead.
 */
export const APP_HOST_RESERVED_SEGMENTS = [
  'showreel',
  'login',
  'api',
  'studio',
  'work-internal',
  'work',
  'about',
  'news',
  'contact',
  'portfolio',
  'search',
  'category',
  'industry',
  'market',
  'video-format',
  'vietnam-production-service',
  'video-campaign-brief',
  'our-industry',
  'our-company',
  'awards',
  'zh',
  'en',
] as const

export function isAppHostReservedSegment(segment: string): boolean {
  return (APP_HOST_RESERVED_SEGMENTS as readonly string[]).includes(segment)
}

/** Origins allowed to call Studio-adjacent browser APIs (CORS). */
export function isAllowedVantageBrowserOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return ['3333', '3000', '3001', ''].includes(url.port)
    }
    if (url.hostname === 'vantage-pictures.sanity.studio') return true
    if (url.hostname.endsWith('.sanity.studio')) return true
    if (url.hostname === getSiteHostname() || url.hostname === `www.${getSiteHostname()}`) {
      return true
    }
    if (url.hostname === getAppHostname()) return true
    if (url.hostname.endsWith('.vercel.app') && url.hostname.includes('vantage')) {
      return true
    }
  } catch {
    return false
  }
  return false
}
