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
  vimeoUrl?: string | null
  xinpianchangUrl?: string | null
}

export type ShowreelPublicData = {
  _id: string
  title: string
  description?: string
  items: ShowreelPublicItem[]
}

/** Main film URLs — prefer videos[0], fall back to legacy root fields. */
export function showreelItemVideoUrls(item: ShowreelPublicItem): {
  vimeoUrl?: string
  xinpianchangUrl?: string
} {
  const main = item.videos?.find((row) => row != null) ?? null
  const vimeoUrl =
    main?.vimeoUrl?.trim() || item.vimeoUrl?.trim() || undefined
  const xinpianchangUrl =
    main?.xinpianchangUrl?.trim() || item.xinpianchangUrl?.trim() || undefined
  return {vimeoUrl, xinpianchangUrl}
}
