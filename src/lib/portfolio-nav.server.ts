/**
 * Server-only portfolio project-nav data loaders (Sanity live fetch).
 * Do not import from client components — use `@/lib/portfolio-nav` there.
 */

import {sanityFetch} from '@/sanity/lib/live'
import {
  PORTFOLIO_NAV_CARDS_BY_IDS_QUERY,
  PORTFOLIO_NAV_RING_QUERY,
} from '@/sanity/queries/portfolioNav'
import {
  neighborIndices,
  wrapIndex,
  type PortfolioNavCard,
  type PortfolioNavData,
  type PortfolioNavSlideRef,
} from '@/lib/portfolio-nav'

export async function fetchPortfolioNavCardsByIds(
  ids: string[],
): Promise<PortfolioNavCard[]> {
  const unique = [...new Set(ids.filter((id) => typeof id === 'string' && id))]
  if (unique.length === 0) return []

  const result = await sanityFetch({
    query: PORTFOLIO_NAV_CARDS_BY_IDS_QUERY,
    params: {ids: unique},
    stega: false,
  })
  return (result.data ?? []) as PortfolioNavCard[]
}

/**
 * Thin ring + seed cards for project-nav.
 * Returns null when the entry is missing from the public catalog or alone.
 */
export async function loadPortfolioNavData(
  currentId: string,
): Promise<PortfolioNavData | null> {
  const ringResult = await sanityFetch({
    query: PORTFOLIO_NAV_RING_QUERY,
    stega: false,
  })
  const ring = (
    (ringResult.data ?? []) as {
      _id: string
      slug: string | null
      slugZh: string | null
      publishedAt: string | null
    }[]
  ).filter((entry) => typeof entry.slug === 'string' && entry.slug.length > 0)

  if (ring.length < 2) return null

  const currentRingIndex = ring.findIndex((entry) => entry._id === currentId)
  if (currentRingIndex < 0) return null

  // Rotate so [0] = chronological next; omit the page you’re already on.
  const slides: PortfolioNavSlideRef[] = []
  for (let step = 1; step < ring.length; step++) {
    const entry = ring[wrapIndex(currentRingIndex + step, ring.length)]!
    slides.push({
      _id: entry._id,
      slug: entry.slug!,
      slugZh: entry.slugZh,
      publishedAt: entry.publishedAt,
    })
  }

  if (slides.length < 1) return null

  const seedIds = neighborIndices(0, slides.length).map(
    (idx) => slides[idx]!._id,
  )
  const initialCards = await fetchPortfolioNavCardsByIds(seedIds)

  return {
    catalogLength: ring.length,
    slides,
    initialCards,
  }
}
