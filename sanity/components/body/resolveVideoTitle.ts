/**
 * Resolve a display title for a video URL (oEmbed → portfolio match).
 */

import {compileDisplayTitles, trimPart} from '@display-titles'
import {extractVimeoId, extractYouTubeId, fetchVideoOEmbedTitle} from '@video-url'
import type {SanityClient} from 'sanity'

type PortfolioHit = {
  title?: string
  displayTitleParts?: {
    brandName?: string
    productName?: string
    campaignTitle?: string
  }
  vimeoUrl?: string
  additionalVideos?: Array<{
    vimeoUrl?: string
    videoTitle?: string
  }>
}

function entryLabel(doc: PortfolioHit): string {
  const parts = doc.displayTitleParts
  if (parts && trimPart(parts.brandName)) {
    const compiled = compileDisplayTitles({
      brandName: parts.brandName,
      productName: parts.productName,
      campaignTitle: parts.campaignTitle,
    }).documentTitle
    if (trimPart(compiled)) return compiled
  }
  return doc.title?.trim() || ''
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase()
}

function urlsMatch(a: string, b: string): boolean {
  const na = normalizeUrl(a)
  const nb = normalizeUrl(b)
  if (na === nb) return true
  const idA = extractVimeoId(a) || extractYouTubeId(a)
  const idB = extractVimeoId(b) || extractYouTubeId(b)
  return Boolean(idA && idB && idA === idB)
}

/** Match hero or additional video URL → best available title from portfolio. */
export async function fetchPortfolioVideoTitle(
  client: SanityClient,
  url: string,
): Promise<string | null> {
  const videoId = extractVimeoId(url) || extractYouTubeId(url)
  if (!videoId) return null

  const rows = await client.fetch<PortfolioHit[]>(
    `*[_type == "portfolioEntry" && !(_id in path("drafts.**")) && (
      vimeoUrl match $needle ||
      count((additionalVideos[defined(vimeoUrl) && vimeoUrl match $needle])) > 0
    )][0...16]{
      title,
      displayTitleParts,
      vimeoUrl,
      additionalVideos[]{vimeoUrl, videoTitle}
    }`,
    {needle: `*${videoId}*`},
  )

  for (const doc of rows ?? []) {
    if (doc.vimeoUrl && urlsMatch(doc.vimeoUrl, url)) {
      const label = entryLabel(doc)
      if (label) return label
    }
    for (const av of doc.additionalVideos ?? []) {
      if (!av?.vimeoUrl || !urlsMatch(av.vimeoUrl, url)) continue
      const title = av.videoTitle?.trim() || entryLabel(doc)
      if (title) return title
    }
  }

  return null
}

/**
 * Best-effort title for Studio previews:
 * 1) provider / noembed oEmbed
 * 2) matching portfolio entry / additional video
 */
export async function resolveVideoTitle(
  client: SanityClient,
  url: string,
): Promise<string | null> {
  const trimmed = url.trim()
  if (!trimmed) return null

  const fromOEmbed = await fetchVideoOEmbedTitle(trimmed)
  if (fromOEmbed) return fromOEmbed

  try {
    return await fetchPortfolioVideoTitle(client, trimmed)
  } catch {
    return null
  }
}
