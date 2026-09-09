/**
 * Create a showreel document (password-gated).
 *
 * POST body: { title, description?, portfolioItemIds: string[] }
 * Returns: { id } — opaque Sanity `_id` used as the URL segment.
 */

import {randomUUID} from 'node:crypto'
import {NextResponse, type NextRequest} from 'next/server'
import {requireShowreelAuth} from '@/lib/showreel-auth'
import {getSanityWriteClient} from '@/lib/sanity-write-client'
import {showreelId} from '@/lib/showreel-id'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CreateShowreelBody = {
  title?: unknown
  description?: unknown
  portfolioItemIds?: unknown
}

function asTrimmedString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }
  return ''
}

function parsePortfolioItemIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const ids: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') return null
    const id = item.trim()
    if (!id) return null
    ids.push(id)
  }
  return ids
}

/** Published, non-trashed portfolioEntry ids that exist in the dataset. */
async function existingPortfolioEntryIds(
  ids: string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const client = getSanityWriteClient()
  const found = await client.fetch<string[]>(
    `*[_type == "portfolioEntry"
      && _id in $ids
      && !(_id in path("drafts.**"))
      && !defined(trash.trashedAt)
    ]._id`,
    {ids},
  )
  return new Set(found)
}

export async function POST(request: NextRequest) {
  const unauthorized = requireShowreelAuth(request)
  if (unauthorized) return unauthorized

  let body: CreateShowreelBody
  try {
    body = (await request.json()) as CreateShowreelBody
  } catch {
    return NextResponse.json({error: 'Invalid JSON body'}, {status: 400})
  }

  const title = asTrimmedString(body.title)
  if (!title) {
    return NextResponse.json({error: 'title is required'}, {status: 400})
  }

  const description = asTrimmedString(body.description)
  const portfolioItemIds = parsePortfolioItemIds(body.portfolioItemIds)
  if (!portfolioItemIds || portfolioItemIds.length === 0) {
    return NextResponse.json(
      {error: 'portfolioItemIds must be a non-empty array of strings'},
      {status: 400},
    )
  }

  // Dedupe while preserving first-seen order for the stored array.
  const uniqueIds = [...new Set(portfolioItemIds)]

  let foundIds: Set<string>
  try {
    foundIds = await existingPortfolioEntryIds(uniqueIds)
  } catch (err) {
    console.error('[showreel] portfolio id lookup failed:', err)
    return NextResponse.json(
      {error: 'Failed to validate portfolio items'},
      {status: 500},
    )
  }

  const missing = uniqueIds.filter((id) => !foundIds.has(id))
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: 'One or more portfolioItemIds do not resolve to portfolio entries',
        missing,
      },
      {status: 400},
    )
  }

  const id = showreelId()
  const portfolioItems = uniqueIds.map((ref) => ({
    _key: randomUUID().replace(/-/g, '').slice(0, 12),
    _type: 'reference' as const,
    _ref: ref,
  }))

  try {
    const client = getSanityWriteClient()
    await client.create({
      _id: id,
      _type: 'showreel',
      title,
      ...(description ? {description} : {}),
      portfolioItems,
    })
  } catch (err) {
    console.error('[showreel] create failed:', err)
    return NextResponse.json(
      {error: 'Failed to create showreel'},
      {status: 500},
    )
  }

  return NextResponse.json({id}, {status: 201})
}
