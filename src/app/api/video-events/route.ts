/**
 * Video analytics event ingestion — write-only POST to Sanity `videoEvent` docs.
 *
 * Uses SANITY_VIDEO_EVENTS_WRITE_TOKEN (server-only). No read surface.
 */

import {createClient, type SanityClient} from '@sanity/client'
import {NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type VideoEventPayload = {
  eventType?: unknown
  milestonePercent?: unknown
  source?: unknown
  videoId?: unknown
  portfolioEntryRef?: unknown
  pagePath?: unknown
  locale?: unknown
  sessionId?: unknown
  createdAt?: unknown
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function parsePortfolioEntryRef(
  value: unknown,
): {_type: 'reference'; _ref: string; _weak: true} | undefined {
  if (value == null) return undefined

  if (typeof value === 'string') {
    const ref = value.trim()
    if (!ref) return undefined
    return {_type: 'reference', _ref: ref, _weak: true}
  }

  if (typeof value === 'object') {
    const ref = asString((value as {_ref?: unknown})._ref)
    if (!ref) return undefined
    return {_type: 'reference', _ref: ref, _weak: true}
  }

  return undefined
}

function getVideoEventsWriteClient(): SanityClient {
  const token = process.env.SANITY_VIDEO_EVENTS_WRITE_TOKEN ?? ''
  if (!token) {
    throw new Error('SANITY_VIDEO_EVENTS_WRITE_TOKEN is not configured')
  }

  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2025-02-19',
    token,
    useCdn: false,
    perspective: 'raw',
  })
}

function validatePayload(payload: VideoEventPayload): {
  ok: true
  event: {
    eventType: string
    source: string
    pagePath: string
    locale: string
    sessionId: string
    milestonePercent?: number
    videoId?: string
    portfolioEntryRef?: {_type: 'reference'; _ref: string; _weak: true}
  }
} | {ok: false; error: string} {
  const eventType = asString(payload.eventType)
  const source = asString(payload.source)
  const pagePath = asString(payload.pagePath)
  const locale = asString(payload.locale)
  const sessionId = asString(payload.sessionId)

  if (!eventType || !source || !pagePath || !locale || !sessionId) {
    return {
      ok: false,
      error: 'eventType, source, pagePath, locale, and sessionId are required',
    }
  }

  const videoId = asString(payload.videoId) || undefined
  const milestonePercent = asOptionalNumber(payload.milestonePercent)
  const portfolioEntryRef = parsePortfolioEntryRef(payload.portfolioEntryRef)

  return {
    ok: true,
    event: {
      eventType,
      source,
      pagePath,
      locale,
      sessionId,
      ...(milestonePercent != null ? {milestonePercent} : {}),
      ...(videoId ? {videoId} : {}),
      ...(portfolioEntryRef ? {portfolioEntryRef} : {}),
    },
  }
}

export async function POST(request: Request) {
  try {
    let payload: VideoEventPayload
    try {
      payload = (await request.json()) as VideoEventPayload
    } catch (err) {
      console.error('[video-events] invalid JSON body:', err)
      return NextResponse.json({error: 'Invalid JSON body'}, {status: 400})
    }

    const validated = validatePayload(payload)
    if (!validated.ok) {
      return NextResponse.json({error: validated.error}, {status: 400})
    }

    const client = getVideoEventsWriteClient()
    await client.create({
      _type: 'videoEvent',
      ...validated.event,
      createdAt: new Date().toISOString(),
    })

    return new NextResponse(null, {status: 204})
  } catch (err) {
    console.error('[video-events] write failed:', err)
    return NextResponse.json({error: 'Failed to record event'}, {status: 500})
  }
}
