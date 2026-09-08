/**
 * Portfolio project-nav (prev/next carousel) GROQ.
 *
 * Thin ordered ring for Embla slide identity; lean cards fetched in batches
 * (SSR seed window + client prefetch as the user advances).
 */

import {defineQuery} from 'groq'

/** Half-width of the card hydrate window (±5 → up to 11 cards). */
export const PORTFOLIO_NAV_PREFETCH_RADIUS = 5

/** Lightweight ordered ring — ids + slugs only. */
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
export const PORTFOLIO_NAV_CARDS_BY_IDS_QUERY = defineQuery(`
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
