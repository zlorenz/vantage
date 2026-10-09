/**
 * Showreel public page types + helpers (English content only for v1).
 */

import type {SanityImage} from '@/types/sanity'

export type ShowreelPublicItem = {
  _id: string
  title: string
  displayTitleParts?: {
    brandName?: string | null
    productName?: string | null
    campaignTitle?: string | null
    brandNameZh?: string | null
    productNameZh?: string | null
    campaignTitleZh?: string | null
  } | null
  thumbTitleOverride?: string | null
  featuredImage?: SanityImage | null
  slug?: string | null
  videos?: Array<{
    vimeoUrl?: string | null
    xinpianchangUrl?: string | null
  } | null> | null
}

export type ShowreelPublicData = {
  _id: string
  title: string
  description?: string
  items: ShowreelPublicItem[]
}

/** Main film URLs from videos[0]. */
export function showreelItemVideoUrls(item: ShowreelPublicItem): {
  vimeoUrl?: string
  xinpianchangUrl?: string
} {
  const main = item.videos?.find((row) => row != null) ?? null
  return {
    vimeoUrl: main?.vimeoUrl?.trim() || undefined,
    xinpianchangUrl: main?.xinpianchangUrl?.trim() || undefined,
  }
}
