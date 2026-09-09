/**
 * Create a showreel document (password-gated).
 *
 * POST body: { title, description?, portfolioItemIds: string[] }
 * Returns: { id } — opaque Sanity `_id` used as the URL segment.
 */

import {NextResponse, type NextRequest} from 'next/server'
import {requireShowreelAuth} from '@/lib/showreel-auth'
import {getSanityWriteClient} from '@/lib/sanity-write-client'
import {showreelId} from '@/lib/showreel-id'
import {
  asTrimmedString,
  existingPortfolioEntryIds,
  parsePortfolioItemIds,
  portfolioItemRefsFromIds,
  uniquePortfolioItemIds,
} from '@/lib/showreel-portfolio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type CreateShowreelBody = {
  title?: unknown
  description?: unknown
  portfolioItemIds?: unknown
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

  const uniqueIds = uniquePortfolioItemIds(portfolioItemIds)

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
  const portfolioItems = portfolioItemRefsFromIds(uniqueIds)

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
