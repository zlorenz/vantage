/**
 * Client-side video analytics — session id, fire-and-forget POST to /api/video-events.
 *
 * Safe to call from effects and event handlers. Never throws; never blocks the caller.
 */

import type {VideoEvent} from '@/sanity/sanity.types'
import type {Locale} from '@/i18n/routing'

const SESSION_STORAGE_KEY = 'vp:video-events:session-id'
const VIDEO_EVENTS_ENDPOINT = '/api/video-events'

export type VideoEventType = NonNullable<VideoEvent['eventType']>
export type VideoEventSource = NonNullable<VideoEvent['source']>
export type VideoEventMilestonePercent = NonNullable<VideoEvent['milestonePercent']>

/** Fields callers supply; sessionId, pagePath, and locale are filled automatically. */
export type VideoEventInput = {
  eventType: VideoEventType
  source: VideoEventSource
  milestonePercent?: VideoEventMilestonePercent
  videoId?: string
  /** Sanity document id for portfolioEntry (weak ref on write). */
  portfolioEntryRef?: string
}

type VideoEventPayload = VideoEventInput & {
  sessionId: string
  pagePath: string
  locale: Locale
}

const impressedSlideKeys = new Set<string>()
let fallbackSessionId: string | null = null

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `vp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Derive locale from the URL — /zh/… → zh, otherwise en (matches next-intl as-needed). */
function localeFromPathname(pathname: string): Locale {
  return pathname === '/zh' || pathname.startsWith('/zh/') ? 'zh' : 'en'
}

function currentPagePath(): string {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}`
}

function sendPayload(payload: VideoEventPayload): void {
  const body = JSON.stringify(payload)

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], {type: 'application/json'})
    if (navigator.sendBeacon(VIDEO_EVENTS_ENDPOINT, blob)) return
  }

  void fetch(VIDEO_EVENTS_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
    keepalive: true,
  }).catch(() => {})
}

/**
 * Read or create a browser-tab session id in sessionStorage.
 * Falls back to an in-memory id when storage is unavailable.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''

  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (existing) return existing

    const id = newSessionId()
    sessionStorage.setItem(SESSION_STORAGE_KEY, id)
    return id
  } catch {
    fallbackSessionId ??= newSessionId()
    return fallbackSessionId
  }
}

/**
 * Record a video analytics event. Fills sessionId, pagePath, and locale automatically.
 * Uses sendBeacon when available; otherwise fetch with keepalive. Never throws.
 */
export function trackVideoEvent(event: VideoEventInput): void {
  try {
    if (typeof window === 'undefined') return

    const sessionId = getOrCreateSessionId()
    if (!sessionId) return

    const payload: VideoEventPayload = {
      ...event,
      sessionId,
      pagePath: currentPagePath(),
      locale: localeFromPathname(window.location.pathname),
    }

    sendPayload(payload)
  } catch {
    // Fire-and-forget — analytics must not disturb playback or navigation.
  }
}

/**
 * Log at most one carousel impression per slideKey per browser session (in-memory).
 */
export function trackImpressionOnce(slideKey: string, event: Omit<VideoEventInput, 'eventType'>): void {
  try {
    if (!slideKey || impressedSlideKeys.has(slideKey)) return
    impressedSlideKeys.add(slideKey)
    trackVideoEvent({...event, eventType: 'impression'})
  } catch {
    // trackVideoEvent is already guarded; keep wrapper non-throwing too.
  }
}
