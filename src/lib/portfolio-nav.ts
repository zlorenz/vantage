/**
 * Portfolio project-nav ring math + data loader.
 *
 * Wraparound: index 0’s prev = last; last’s next = 0 (publishedAt desc ring).
 * Prefetch window: ±PORTFOLIO_NAV_WINDOW around the current entry (modular),
 * so catalog edges already include both ends of the ring.
 */

import {sanityFetch} from '@/sanity/lib/live'
import {
  PORTFOLIO_NAV_CARDS_QUERY,
  PORTFOLIO_NAV_RING_QUERY,
  PORTFOLIO_NAV_WINDOW,
} from '@/sanity/queries/portfolioNav'
import type {SanityImageSource} from '@sanity/image-url'

export type PortfolioNavRingEntry = {
  _id: string
  slug: string | null
  slugZh: string | null
  publishedAt: string | null
}

export type PortfolioNavCard = {
  _id: string
  slug: string | null
  slugZh: string | null
  publishedAt: string | null
  title: string | null
  titleZh: string | null
  displayTitleParts: {
    brandName?: string | null
    productName?: string | null
    campaignTitle?: string | null
    brandNameZh?: string | null
    productNameZh?: string | null
    campaignTitleZh?: string | null
  } | null
  featuredImage: SanityImageSource | null
  primaryFormat: {
    title: string | null
    titleZh: string | null
  } | null
}

export type PortfolioNavData = {
  /** Full public catalog length (wrap uses this, not the window size). */
  ringLength: number
  /** Ring index of the page being viewed. */
  currentRingIndex: number
  /** Initial slide = chronological next (current + 1, wrapped). */
  initialRingIndex: number
  /**
   * Prefetched cards in ring order for the ±WINDOW neighborhood.
   * Arrow cycling walks these; wrap at ends jumps via ring modulo using
   * indices already present at catalog edges.
   */
  cards: PortfolioNavCard[]
  /** Ring index for each `cards[i]` (same length as cards). */
  cardRingIndices: number[]
}

/** Modular neighbor indices: (center + d) mod n for d in [-window, +window]. */
export function modularWindowIndices(
  center: number,
  length: number,
  window: number = PORTFOLIO_NAV_WINDOW,
): number[] {
  if (length <= 0 || center < 0) return []
  if (length === 1) return [0]

  const span = Math.min(window, length - 1)
  const out: number[] = []
  const seen = new Set<number>()
  for (let d = -span; d <= span; d++) {
    const idx = ((center + d) % length + length) % length
    if (seen.has(idx)) continue
    seen.add(idx)
    out.push(idx)
  }
  return out
}

/** Sort window indices into ascending ring order starting at the lowest gap-free run around center — actually chronological ring order for display cycling: start from (center - span) walking forward. */
export function orderedWindowIndices(
  center: number,
  length: number,
  window: number = PORTFOLIO_NAV_WINDOW,
): number[] {
  if (length <= 0 || center < 0) return []
  if (length === 1) return [0]

  const span = Math.min(window, length - 1)
  const start = ((center - span) % length + length) % length
  const count = Math.min(length, span * 2 + 1)
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    out.push((start + i) % length)
  }
  return out
}

export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

/**
 * Load ring + lean cards for the ±WINDOW neighborhood of `currentId`.
 * Returns null when the entry is missing from the public ring or alone.
 */
export async function loadPortfolioNavData(
  currentId: string,
): Promise<PortfolioNavData | null> {
  const ringResult = await sanityFetch({
    query: PORTFOLIO_NAV_RING_QUERY,
    stega: false,
  })
  const ring = (ringResult.data ?? []) as PortfolioNavRingEntry[]
  if (ring.length < 2) return null

  const currentRingIndex = ring.findIndex((entry) => entry._id === currentId)
  if (currentRingIndex < 0) return null

  const cardRingIndices = orderedWindowIndices(
    currentRingIndex,
    ring.length,
    PORTFOLIO_NAV_WINDOW,
  )
  const ids = cardRingIndices.map((idx) => ring[idx]!._id)

  const cardsResult = await sanityFetch({
    query: PORTFOLIO_NAV_CARDS_QUERY,
    params: {ids},
    stega: false,
  })
  const fetched = (cardsResult.data ?? []) as PortfolioNavCard[]
  const byId = new Map(fetched.map((card) => [card._id, card]))

  const cards: PortfolioNavCard[] = []
  const resolvedIndices: number[] = []
  for (const idx of cardRingIndices) {
    const id = ring[idx]!._id
    const card = byId.get(id)
    if (!card?.slug) continue
    cards.push(card)
    resolvedIndices.push(idx)
  }

  if (cards.length < 2) return null

  const initialRingIndex = wrapIndex(currentRingIndex + 1, ring.length)

  return {
    ringLength: ring.length,
    currentRingIndex,
    initialRingIndex,
    cards,
    cardRingIndices: resolvedIndices,
  }
}
