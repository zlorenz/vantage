/**
 * Batch-fetch lean portfolio-nav cards by Sanity document id.
 * Used by the project-nav carousel to hydrate slides as the user advances.
 */

import {NextResponse} from 'next/server'
import {sanityClient} from '@/lib/sanity'
import {PORTFOLIO_NAV_CARDS_BY_IDS_QUERY} from '@/sanity/queries/portfolioNav'
import type {PortfolioNavCard} from '@/lib/portfolio-nav'

const MAX_IDS = 24

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url)
  const raw = searchParams.get('ids')?.trim() ?? ''
  const ids = [
    ...new Set(
      raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_IDS)

  if (ids.length === 0) {
    return NextResponse.json({cards: [] as PortfolioNavCard[]})
  }

  const cards = await sanityClient.fetch<PortfolioNavCard[]>(
    PORTFOLIO_NAV_CARDS_BY_IDS_QUERY,
    {ids},
  )

  return NextResponse.json({cards: cards ?? []})
}
