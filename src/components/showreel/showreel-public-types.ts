/**
 * Showreel public page types + helpers (English content only for v1).
 */

import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang'
import type {SanityImage} from '@/types/sanity'

export type ShowreelPublicVideo = {
  _key?: string | null
  vimeoUrl?: string | null
  xinpianchangUrl?: string | null
  videoTitle?: string | null
  videoTitleZh?: string | null
}

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
  videos?: Array<ShowreelPublicVideo | null> | null
}

export type ShowreelPublicData = {
  _id: string
  title: string
  description?: string
  items: ShowreelPublicItem[]
}

export function showreelVideoIsPlayable(video: ShowreelPublicVideo): boolean {
  if (video.vimeoUrl?.trim()) return true
  const xpc = video.xinpianchangUrl?.trim()
  return Boolean(xpc && xinpianchangToEmbedUrl(xpc))
}

/** Ordered playable clips for lightbox navigation. */
export function showreelPlayableVideos(
  item: ShowreelPublicItem,
): ShowreelPublicVideo[] {
  const out: ShowreelPublicVideo[] = []
  for (const row of item.videos ?? []) {
    if (!row || !showreelVideoIsPlayable(row)) continue
    out.push(row)
  }
  return out
}

/** Main film URLs from the first playable videos[] row. */
export function showreelItemVideoUrls(item: ShowreelPublicItem): {
  vimeoUrl?: string
  xinpianchangUrl?: string
} {
  const main = showreelPlayableVideos(item)[0] ?? null
  return {
    vimeoUrl: main?.vimeoUrl?.trim() || undefined,
    xinpianchangUrl: main?.xinpianchangUrl?.trim() || undefined,
  }
}

export function showreelVideoUrls(video: ShowreelPublicVideo): {
  vimeoUrl?: string
  xinpianchangUrl?: string
} {
  return {
    vimeoUrl: video.vimeoUrl?.trim() || undefined,
    xinpianchangUrl: video.xinpianchangUrl?.trim() || undefined,
  }
}
