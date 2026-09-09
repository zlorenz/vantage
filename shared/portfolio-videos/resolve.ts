/**
 * Resolve ordered portfolio videos with dual-read for the legacy main-film
 * fields + additionalVideos[] shape.
 *
 * Prefer `videos[]` when present (first item = main film). Otherwise synthesize
 * from root vimeoUrl / heroFilmTitle / preview* + additionalVideos.
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
  vimeoUrl?: string | null
  xinpianchangUrl?: string | null
  heroFilmTitle?: string | null
  heroFilmTitleZh?: string | null
  previewCleanVimeoUrl?: string | null
  previewStartSeconds?: number | null
  previewEndSeconds?: number | null
  additionalVideos?: PortfolioVideoFields[] | null
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
 * Ordered playable rows. Empty array when neither unified nor legacy main URL
 * is present.
 */
export function resolvePortfolioVideos(
  entry: PortfolioVideoSource,
): PortfolioVideoFields[] {
  if (Array.isArray(entry.videos) && entry.videos.length > 0) {
    return entry.videos
  }

  const mainUrl = trimOrUndefined(entry.vimeoUrl)
  const mainXpc = trimOrUndefined(entry.xinpianchangUrl)
  const additionals = entry.additionalVideos ?? []

  if (!mainUrl && !mainXpc && additionals.length === 0) {
    return []
  }

  const main: PortfolioVideoFields = {
    _key: 'legacy-main',
    vimeoUrl: mainUrl,
    xinpianchangUrl: mainXpc,
    videoTitle: trimOrUndefined(entry.heroFilmTitle),
    videoTitleZh: trimOrUndefined(entry.heroFilmTitleZh),
    previewCleanVimeoUrl: trimOrUndefined(entry.previewCleanVimeoUrl),
    previewStartSeconds: entry.previewStartSeconds ?? undefined,
    previewEndSeconds: entry.previewEndSeconds ?? undefined,
  }

  return [main, ...additionals]
}

/** Main film = first resolved video (unified or legacy). */
export function resolveMainPortfolioVideo(
  entry: PortfolioVideoSource,
): PortfolioVideoFields | null {
  return resolvePortfolioVideos(entry)[0] ?? null
}

/** Episode title for the main film (videos[0].videoTitle or legacy heroFilmTitle). */
export function resolveMainFilmTitle(entry: PortfolioVideoSource): {
  videoTitle?: string
  videoTitleZh?: string
} {
  const main = resolveMainPortfolioVideo(entry)
  return {
    videoTitle: trimOrUndefined(main?.videoTitle ?? entry.heroFilmTitle),
    videoTitleZh: trimOrUndefined(main?.videoTitleZh ?? entry.heroFilmTitleZh),
  }
}

/** Homepage carousel playback URL + bounds (prefer clean preview on main). */
export function resolveCarouselPreviewPlayback(entry: PortfolioVideoSource): {
  vimeoUrl: string | null
  previewStartSeconds: number | null
  previewEndSeconds: number | null
} {
  const main = resolveMainPortfolioVideo(entry)
  const clean =
    trimOrUndefined(main?.previewCleanVimeoUrl) ??
    trimOrUndefined(entry.previewCleanVimeoUrl)
  const master =
    trimOrUndefined(main?.vimeoUrl) ?? trimOrUndefined(entry.vimeoUrl)
  return {
    vimeoUrl: clean ?? master ?? null,
    previewStartSeconds:
      main?.previewStartSeconds ?? entry.previewStartSeconds ?? null,
    previewEndSeconds:
      main?.previewEndSeconds ?? entry.previewEndSeconds ?? null,
  }
}
