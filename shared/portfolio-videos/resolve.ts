/**
 * Resolve ordered portfolio videos from unified `videos[]`
 * (first item = main film).
 */

export type PortfolioVideoFields = {
  _key?: string
  _type?: string
  vimeoUrl?: string | null
  xinpianchangUrl?: string | null
  videoTitle?: string | null
  videoTitleZh?: string | null
  description?: string | null
  descriptionZh?: string | null
  previewCleanVimeoUrl?: string | null
  previewStartSeconds?: number | null
  previewEndSeconds?: number | null
}

export type PortfolioVideoSource = {
  videos?: PortfolioVideoFields[] | null
}

function trimOrUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** True when the unified `videos` array has been written (even if empty). */
export function hasUnifiedVideos(
  entry: Pick<PortfolioVideoSource, 'videos'>,
): boolean {
  return Array.isArray(entry.videos)
}

/**
 * Ordered playable rows. Empty array when `videos` is missing or empty.
 */
export function resolvePortfolioVideos(
  entry: PortfolioVideoSource,
): PortfolioVideoFields[] {
  if (!Array.isArray(entry.videos) || entry.videos.length === 0) {
    return []
  }
  return entry.videos
}

/** Main film = first video. */
export function resolveMainPortfolioVideo(
  entry: PortfolioVideoSource,
): PortfolioVideoFields | null {
  return resolvePortfolioVideos(entry)[0] ?? null
}

/** Episode title for the main film (videos[0].videoTitle). */
export function resolveMainFilmTitle(entry: PortfolioVideoSource): {
  videoTitle?: string
  videoTitleZh?: string
} {
  const main = resolveMainPortfolioVideo(entry)
  return {
    videoTitle: trimOrUndefined(main?.videoTitle),
    videoTitleZh: trimOrUndefined(main?.videoTitleZh),
  }
}

/** Homepage carousel playback URL + bounds (prefer clean preview on main). */
export function resolveCarouselPreviewPlayback(entry: PortfolioVideoSource): {
  vimeoUrl: string | null
  previewStartSeconds: number | null
  previewEndSeconds: number | null
} {
  const main = resolveMainPortfolioVideo(entry)
  const clean = trimOrUndefined(main?.previewCleanVimeoUrl)
  const master = trimOrUndefined(main?.vimeoUrl)
  return {
    vimeoUrl: clean ?? master ?? null,
    previewStartSeconds: main?.previewStartSeconds ?? null,
    previewEndSeconds: main?.previewEndSeconds ?? null,
  }
}
