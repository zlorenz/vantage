/**
 * Path helpers for the internal work library (and sibling utility routes).
 *
 * `/work-internal` is a temporary path prefix on the marketing host until
 * launch, when these routes move to app.vantage.pictures with the prefix
 * stripped:
 *
 *   /work-internal              → app.vantage.pictures/
 *   /work-internal/[slug]       → app.vantage.pictures/[slug]
 *   /showreel/[id]/edit         → app.vantage.pictures/showreel/[id]/edit
 *
 * Prefer these helpers over hardcoding `/work-internal` so the cutover is
 * a single-module change (plus host-based rewrites).
 */

import type {Locale} from '@/i18n/routing'
import type {InternalLibraryEntry} from '@/types/sanity'

/** Temporary marketing-host prefix — strip on app subdomain launch. */
export const WORK_INTERNAL_PATH_PREFIX = '/work-internal' as const

/**
 * Reserved first path segments on the future app subdomain (must not collide
 * with portfolio entry slugs at the root).
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

/** next-intl href for the library index. */
export function workInternalLibraryHref(): WorkInternalLibraryHref {
  return WORK_INTERNAL_PATH_PREFIX
}

/** next-intl href for an internal project detail page. */
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
  const search = takeLibraryReturnSearch()
  return `${WORK_INTERNAL_PATH_PREFIX}${search}`
}

/** True when a portfolio slug would collide with a reserved app segment. */
export function isReservedAppSegment(slug: string): boolean {
  return (APP_SUBDOMAIN_RESERVED_SEGMENTS as readonly string[]).includes(slug)
}

/** Locale-aware public portfolio slug (marketing page). */
export function getPublicPortfolioSlug(
  entry: Pick<InternalLibraryEntry, 'slug' | 'slugZh'>,
  locale: Locale,
): string {
  return locale === 'zh' ? entry.slugZh || entry.slug : entry.slug
}
