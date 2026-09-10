/**
 * Client-side search / filter analytics — fire-and-forget POST to /api/interaction-events.
 *
 * Reuses the video-events session id helper for cross-pipeline correlation.
 * Safe to call from handlers; never throws; never blocks the caller.
 * Skips /work-internal and /showreel paths (including locale-prefixed forms).
 */

import type {Locale} from '@/i18n/routing'
import {getOrCreateSessionId} from '@/lib/video-events'

const INTERACTION_EVENTS_ENDPOINT = '/api/interaction-events'

export type InteractionEventType = 'search_submit' | 'filter_change' | 'result_click'

export type InteractionSourceSurface =
  | 'nav_search'
  | 'work_carousel'
  | 'taxonomy_archive'
  | 'search_page'

export type InteractionResultType = 'portfolio' | 'news'

export type InteractionFilters = {
  format?: string
  industry?: string
  market?: string
}

/** Fields callers supply; sessionId, pagePath, and locale are filled automatically. */
export type InteractionEventInput = {
  eventType: InteractionEventType
  sourceSurface: InteractionSourceSurface
  query?: string
  filters?: InteractionFilters
  resultSlug?: string
  resultType?: InteractionResultType
}

type InteractionEventPayload = InteractionEventInput & {
  sessionId: string
  pagePath: string
  locale: Locale
}

/** Strip optional `/zh` prefix so path guards match unprefixed helpers. */
function pathnameWithoutLocale(pathname: string): string {
  if (pathname === '/zh') return '/'
  if (pathname.startsWith('/zh/')) return pathname.slice(3) || '/'
  return pathname
}

/**
 * Public marketing analytics only — skip internal library and showreel surfaces.
 */
export function shouldSkipInteractionAnalytics(pathname: string): boolean {
  const path = pathnameWithoutLocale(pathname)
  if (path === '/work-internal' || path.startsWith('/work-internal/')) return true
  if (path === '/showreel' || path.startsWith('/showreel/')) return true
  return false
}

function localeFromPathname(pathname: string): Locale {
  return pathname === '/zh' || pathname.startsWith('/zh/') ? 'zh' : 'en'
}

function currentPagePath(): string {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}`
}

function compactFilters(filters?: InteractionFilters): InteractionFilters | undefined {
  if (!filters) return undefined
  const next: InteractionFilters = {}
  if (filters.format?.trim()) next.format = filters.format.trim()
  if (filters.industry?.trim()) next.industry = filters.industry.trim()
  if (filters.market?.trim()) next.market = filters.market.trim()
  return Object.keys(next).length ? next : undefined
}

function sendPayload(payload: InteractionEventPayload): void {
  const body = JSON.stringify(payload)

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], {type: 'application/json'})
    if (navigator.sendBeacon(INTERACTION_EVENTS_ENDPOINT, blob)) return
  }

  void fetch(INTERACTION_EVENTS_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
    keepalive: true,
  }).catch(() => {})
}

/**
 * Record a search / filter analytics event.
 * Fills sessionId, pagePath, and locale automatically. Never throws.
 */
export function trackInteractionEvent(event: InteractionEventInput): void {
  try {
    if (typeof window === 'undefined') return
    if (shouldSkipInteractionAnalytics(window.location.pathname)) return

    const sessionId = getOrCreateSessionId()
    if (!sessionId) return

    const payload: InteractionEventPayload = {
      eventType: event.eventType,
      sourceSurface: event.sourceSurface,
      sessionId,
      pagePath: currentPagePath(),
      locale: localeFromPathname(window.location.pathname),
      ...(event.query?.trim() ? {query: event.query.trim()} : {}),
      ...(compactFilters(event.filters) ? {filters: compactFilters(event.filters)} : {}),
      ...(event.resultSlug?.trim() ? {resultSlug: event.resultSlug.trim()} : {}),
      ...(event.resultType ? {resultType: event.resultType} : {}),
    }

    sendPayload(payload)
  } catch {
    // Fire-and-forget — analytics must not disturb navigation.
  }
}
