/**
 * Portfolio project-nav (prev/next carousel) GROQ.
 *
 * Ring: all public entries ordered publishedAt desc (same as Work index).
 * Cards: lean fields for a modular ±WINDOW window around the current entry.
 */

import {defineQuery} from 'groq'

/** Half-width of the prefetched neighbor window (±5 → up to 11 cards). */
export const PORTFOLIO_NAV_WINDOW = 5

/** Lightweight ordered ring — ids + sort keys only. */
export const PORTFOLIO_NAV_RING_QUERY = defineQuery(`
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt)]
    | order(publishedAt desc, title asc) {
      _id,
      "slug": slug.current,
      "slugZh": slugZh.current,
      publishedAt
    }
`)

/** Lean card payload for project-nav slides (batch by _id). */
export const PORTFOLIO_NAV_CARDS_QUERY = defineQuery(`
  *[_type == "portfolioEntry" && _id in $ids && isHidden != true && !defined(trash.trashedAt)] {
    _id,
    "slug": slug.current,
    "slugZh": slugZh.current,
    publishedAt,
    title,
    titleZh,
    displayTitleParts{
      brandName,
      productName,
      campaignTitle,
      brandNameZh,
      productNameZh,
      campaignTitleZh
    },
    featuredImage,
    "primaryFormat": videoFormats[0]->{
      title,
      titleZh
    }
  }
`)
