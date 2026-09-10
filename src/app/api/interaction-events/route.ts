/**
 * Search / filter analytics ingestion — write-only POST to Sanity `interactionEvent` docs.
 *
 * Reuses SANITY_VIDEO_EVENTS_WRITE_TOKEN (server-only). No read surface.
 */

import {createClient, type SanityClient} from '@sanity/client'
import {NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EVENT_TYPES = new Set(['search_submit', 'filter_change', 'result_click'])
const SOURCE_SURFACES = new Set([
  'nav_search',
  'work_carousel',
  'taxonomy_archive',
  'search_page',
])
const RESULT_TYPES = new Set(['portfolio', 'news'])

type InteractionEventPayload = {
  eventType?: unknown
  sourceSurface?: unknown
  query?: unknown
  filters?: unknown
  resultSlug?: unknown
  resultType?: unknown
  pagePath?: unknown
  locale?: unknown
  sessionId?: unknown
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function parseFilters(
  value: unknown,
): {format?: string; industry?: string; market?: string} | undefined {
  if (value == null || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const filters: {format?: string; industry?: string; market?: string} = {}
  const format = asString(raw.format)
  const industry = asString(raw.industry)
  const market = asString(raw.market)
  if (format) filters.format = format
  if (industry) filters.industry = industry
  if (market) filters.market = market
  return Object.keys(filters).length ? filters : undefined
}

function getWriteClient(): SanityClient {
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

function validatePayload(payload: InteractionEventPayload):
  | {
      ok: true
      event: {
        eventType: string
        sourceSurface: string
        pagePath: string
        locale: string
        sessionId: string
        query?: string
        filters?: {format?: string; industry?: string; market?: string}
        resultSlug?: string
        resultType?: string
      }
    }
  | {ok: false; error: string} {
  const eventType = asString(payload.eventType)
  const sourceSurface = asString(payload.sourceSurface)
  const pagePath = asString(payload.pagePath)
  const locale = asString(payload.locale)
  const sessionId = asString(payload.sessionId)

  if (!eventType || !sourceSurface || !pagePath || !locale || !sessionId) {
    return {
      ok: false,
      error: 'eventType, sourceSurface, pagePath, locale, and sessionId are required',
    }
  }

  if (!EVENT_TYPES.has(eventType)) {
    return {ok: false, error: 'Invalid eventType'}
  }
  if (!SOURCE_SURFACES.has(sourceSurface)) {
    return {ok: false, error: 'Invalid sourceSurface'}
  }

  const query = asString(payload.query) || undefined
  const resultSlug = asString(payload.resultSlug) || undefined
  const resultTypeRaw = asString(payload.resultType)
  const resultType = resultTypeRaw || undefined
  if (resultType && !RESULT_TYPES.has(resultType)) {
    return {ok: false, error: 'Invalid resultType'}
  }

  const filters = parseFilters(payload.filters)

  return {
    ok: true,
    event: {
      eventType,
      sourceSurface,
      pagePath,
      locale,
      sessionId,
      ...(query ? {query} : {}),
      ...(filters ? {filters} : {}),
      ...(resultSlug ? {resultSlug} : {}),
      ...(resultType ? {resultType} : {}),
    },
  }
}

export async function POST(request: Request) {
  try {
    let payload: InteractionEventPayload
    try {
      payload = (await request.json()) as InteractionEventPayload
    } catch (err) {
      console.error('[interaction-events] invalid JSON body:', err)
      return NextResponse.json({error: 'Invalid JSON body'}, {status: 400})
    }

    const validated = validatePayload(payload)
    if (!validated.ok) {
      return NextResponse.json({error: validated.error}, {status: 400})
    }

    const client = getWriteClient()
    await client.create({
      _type: 'interactionEvent',
      ...validated.event,
      createdAt: new Date().toISOString(),
    })

    return new NextResponse(null, {status: 204})
  } catch (err) {
    console.error('[interaction-events] write failed:', err)
    return NextResponse.json({error: 'Failed to record event'}, {status: 500})
  }
}
