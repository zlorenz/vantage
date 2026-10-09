/**
 * EN looping clip for an About preview slot.
 * Custom URLs play in full; portfolio rows use the carousel clean-clip window.
 */

import {resolveCarouselPreviewPlayback} from '@portfolio-videos'
import {isEmbeddableVideoUrl, normalizeStoredVideoUrl} from '@video-url'

type PortfolioPreviewRow = {
  vimeoUrl?: string | null
  previewCleanVimeoUrl?: string | null
  previewStartSeconds?: number | null
  previewEndSeconds?: number | null
}

export type AboutPreviewPlaybackSlot = {
  mediaMode?: string | null
  videoUrl?: string | null
  portfolioEntry?: {
    videos?: Array<PortfolioPreviewRow | null> | null
  } | null
}

export type AboutPreviewPlayback = {
  previewVimeoUrl: string | null
  previewStartSeconds: number | null
  previewEndSeconds: number | null
}

export const EMPTY_ABOUT_PREVIEW_PLAYBACK: AboutPreviewPlayback = {
  previewVimeoUrl: null,
  previewStartSeconds: null,
  previewEndSeconds: null,
}

export function resolveAboutPreviewPlayback(
  slot: AboutPreviewPlaybackSlot | null | undefined,
): AboutPreviewPlayback {
  if (!slot || slot.mediaMode === 'staticImage') {
    return EMPTY_ABOUT_PREVIEW_PLAYBACK
  }

  if (slot.mediaMode === 'customVideo') {
    const url = slot.videoUrl?.trim()
    if (!url || !isEmbeddableVideoUrl(url)) {
      return EMPTY_ABOUT_PREVIEW_PLAYBACK
    }
    return {
      previewVimeoUrl: normalizeStoredVideoUrl(url),
      previewStartSeconds: null,
      previewEndSeconds: null,
    }
  }

  const entry = slot.portfolioEntry
  if (!entry) return EMPTY_ABOUT_PREVIEW_PLAYBACK

  const preview = resolveCarouselPreviewPlayback({
    videos: (entry.videos ?? []).filter(
      (row): row is PortfolioPreviewRow => row != null,
    ),
  })

  return {
    previewVimeoUrl: preview.vimeoUrl,
    previewStartSeconds: preview.previewStartSeconds,
    previewEndSeconds: preview.previewEndSeconds,
  }
}
