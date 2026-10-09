/**
 * Path helpers for the internal work library (and sibling utility routes).
 *
 * Canonical host: app.vantage.pictures (NEXT_PUBLIC_APP_HOST)
 *
 *   app.vantage.pictures/                 → library index
 *   app.vantage.pictures/[slug]           → library detail
 *   app.vantage.pictures/showreel/.../edit
 *
 * Marketing host keeps `/work-internal` only as a redirect target into the
 * app host. Filesystem routes remain under `/work-internal` and are reached
 * via middleware rewrites on the app host.
 */

import type {Locale} from '@/i18n/routing'
import type {InternalLibraryEntry} from '@/types/sanity'
import {
  getSiteOrigin,
  isAppHostname,
  isAppHostReservedSegment,
} from '@/lib/site-hosts'

/** Filesystem / next-intl pathname prefix (rewritten away on the app host). */
export const WORK_INTERNAL_PATH_PREFIX = '/work-internal' as const

/**
 * @deprecated Prefer APP_HOST_RESERVED_SEGMENTS from site-hosts — kept for
 * callers that imported the old name.
 */
export const APP_SUBDOMAIN_RESERVED_SEGMENTS = [
  'showreel',
  'login',
  'api',
  'studio',
] as const

export type WorkInternalLibraryHref = typeof WORK_INTERNAL_PATH_PREFIX

export type WorkInternalEntryHref = {
  pathname: '/work-internal/[slug]'
  params: {slug: string}
}

const RETURN_SEARCH_KEY = 'vp-work-internal-return'

/** True when the browser (or SSR host) is the app subdomain. */
export function isAppHostClient(hostname?: string): boolean {
  if (hostname) return isAppHostname(hostname)
  if (typeof window === 'undefined') return false
  return isAppHostname(window.location.hostname)
}

/**
 * Browser-visible library index path on the current host.
 * App host: `/` — marketing (legacy): `/work-internal`.
 */
export function workInternalLibraryBrowserPath(
  hostname?: string,
  search = '',
): string {
  const qs = search && !search.startsWith('?') ? `?${search}` : search
  if (isAppHostClient(hostname)) return `/${qs}`
  return `${WORK_INTERNAL_PATH_PREFIX}${qs}`
}

/**
 * Browser-visible detail path for a library entry.
 * App host: `/{slug}` — marketing (legacy): `/work-internal/{slug}`.
 */
export function workInternalEntryBrowserPath(
  slug: string,
  hostname?: string,
): string {
  if (isAppHostClient(hostname)) return `/${slug}`
  return `${WORK_INTERNAL_PATH_PREFIX}/${slug}`
}

/** next-intl href for the library index (filesystem path). */
export function workInternalLibraryHref(): WorkInternalLibraryHref {
  return WORK_INTERNAL_PATH_PREFIX
}

/** next-intl href for an internal project detail page (filesystem path). */
export function workInternalEntryHref(slug: string): WorkInternalEntryHref {
  return {
    pathname: '/work-internal/[slug]',
    params: {slug},
  }
}

/**
 * Slug used in `/work-internal/[slug]` URLs.
 * Always English `slug` — the library is EN-primary (same path under /zh/).
 */
export function getWorkInternalEntrySlug(
  entry: Pick<InternalLibraryEntry, 'slug'>,
): string {
  return entry.slug
}

export function isWorkInternalPath(pathname: string): boolean {
  return (
    pathname === WORK_INTERNAL_PATH_PREFIX ||
    pathname.startsWith(`${WORK_INTERNAL_PATH_PREFIX}/`)
  )
}

/**
 * Showreel editor utility routes (locale-stripped pathname from next-intl).
 * Public `/showreel/[id]` is intentionally excluded — marketing chrome stays.
 */
export function isShowreelEditorChromePath(pathname: string): boolean {
  if (
    pathname === '/showreel/login' ||
    pathname.startsWith('/showreel/login/')
  ) {
    return true
  }
  return /^\/showreel\/(?!login(?:\/|$))[^/]+\/edit\/?$/.test(pathname)
}

/**
 * Routes that use the minimal internal nav + footer instead of marketing chrome.
 *
 * On the app host the browser path is `/` or `/{slug}` (rewrite hides
 * `/work-internal`), so host wins over pathname. Pass `hostname` from the
 * request Host header for SSR; omit it in the browser to use `window`.
 */
export function isInternalAppChromePath(
  pathname: string,
  hostname?: string,
): boolean {
  if (hostname !== undefined ? isAppHostname(hostname) : isAppHostClient()) {
    return true
  }
  return isWorkInternalPath(pathname) || isShowreelEditorChromePath(pathname)
}

export function isWorkInternalLibraryPath(pathname: string): boolean {
  return pathname === WORK_INTERNAL_PATH_PREFIX
}

/** Persist the library query string before navigating to a detail page. */
export function rememberLibraryReturnSearch(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(RETURN_SEARCH_KEY, window.location.search)
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/** Query string (including `?`) to restore on Back, or empty. */
export function takeLibraryReturnSearch(): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw = window.sessionStorage.getItem(RETURN_SEARCH_KEY)
    if (!raw) return ''
    return raw.startsWith('?') || raw === '' ? raw : `?${raw}`
  } catch {
    return ''
  }
}

/**
 * Full browser path for returning to the library (prefix + optional search).
 * Used with router.push string form after reading sessionStorage.
 */
export function libraryReturnBrowserPath(): string {
  return workInternalLibraryBrowserPath(undefined, takeLibraryReturnSearch())
}

/** True when a portfolio slug would collide with a reserved app segment. */
export function isReservedAppSegment(slug: string): boolean {
  return (
    isAppHostReservedSegment(slug) ||
    (APP_SUBDOMAIN_RESERVED_SEGMENTS as readonly string[]).includes(slug)
  )
}

/** Locale-aware public portfolio slug (marketing page). */
export function getPublicPortfolioSlug(
  entry: Pick<InternalLibraryEntry, 'slug' | 'slugZh'>,
  locale: Locale,
): string {
  return locale === 'zh' ? entry.slugZh || entry.slug : entry.slug
}

/** Marketing homepage URL for the brand mark (opens in a new tab). */
export function marketingHomeUrl(): string {
  if (typeof window !== 'undefined' && isAppHostname(window.location.hostname)) {
    return `${getSiteOrigin()}/`
  }
  return '/'
}
