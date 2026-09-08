/**
 * Portfolio project-nav types + ring math.
 *
 * Client-safe — no Sanity live/token imports. Server loaders live in
 * `portfolio-nav.server.ts`.
 */

import type {SanityImageSource} from '@sanity/image-url'
import {PORTFOLIO_NAV_PREFETCH_RADIUS} from '@/sanity/queries/portfolioNav'

export type PortfolioNavSlideRef = {
  _id: string
  slug: string
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
  /** Full public catalog length (including the current page entry). */
  catalogLength: number
  /** Chronological slides starting at next-after-current (current omitted). */
  slides: PortfolioNavSlideRef[]
  /** Seed cards for ±PREFETCH_RADIUS around start (index 0). */
  initialCards: PortfolioNavCard[]
}

export {PORTFOLIO_NAV_PREFETCH_RADIUS}

export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

/** Shortest-path distance on a looped ring. */
export function loopDistance(a: number, b: number, length: number): number {
  if (length <= 0) return 0
  const raw = Math.abs(a - b)
  return Math.min(raw, length - raw)
}

/** Neighbor indices around `center` within `radius` (inclusive), modular. */
export function neighborIndices(
  center: number,
  length: number,
  radius: number = PORTFOLIO_NAV_PREFETCH_RADIUS,
): number[] {
  if (length <= 0 || center < 0) return []
  const span = Math.min(radius, length - 1)
  const out: number[] = []
  const seen = new Set<number>()
  for (let d = -span; d <= span; d++) {
    const idx = wrapIndex(center + d, length)
    if (seen.has(idx)) continue
    seen.add(idx)
    out.push(idx)
  }
  return out
}
