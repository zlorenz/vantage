/**
 * Build serializable slide props for PortfolioCaseCarousel.
 *
 * Poster priority per slide:
 * 1. videos[].thumbnail (player-only override)
 * 2. Main film only: campaign featuredImage
 * 3. Provider still (highest-res Vimeo / YouTube maxres)
 *
 * Overlay titles are plain episode strings only (videoTitle / legacy heroFilmTitle) —
 * never the composed Brand+Product+Campaign long title.
 */

import {
  resolvePortfolioVideoPosterSource,
  resolvePortfolioVideos,
  type PortfolioVideoFields,
  type PortfolioVideoSource,
  type PortfolioVideoThumbnail,
} from '@portfolio-videos'
import {urlForImage} from '@/lib/sanity'
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field'
import {parseVideoUrl, youTubePosterUrl} from '@/lib/video-url'
import {fetchHighestVimeoThumbnailUrl} from '@/lib/vimeo'
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang'
import type {Locale} from '@/i18n/routing'
import type {SanityImage} from '@/types/sanity'

type SlideBase = {
  key: string
  /** Plain film/episode title for card overlay; omit when empty. */
  overlayTitle?: string
  /** Locale-resolved description for desktop “more info” panel; omit when empty. */
  description?: string
}

export type PortfolioCaseSlide = SlideBase &
  (
    | {
        kind: 'vimeo'
        vimeoUrl: string
        posterUrl?: string
        portfolioEntryRef?: string
      }
    | {
        kind: 'youtube'
        videoId: string
        posterUrl: string
        portfolioEntryRef?: string
      }
    | {
        kind: 'xinpianchang'
        embedUrl: string
        posterUrl?: string
        portfolioEntryRef?: string
      }
  )

export function isPlayablePortfolioVideo(
  video: Pick<PortfolioVideoFields, 'vimeoUrl' | 'xinpianchangUrl'>,
  locale: Locale,
): boolean {
  return Boolean(
    video.vimeoUrl?.trim() ||
      (locale === 'zh' && video.xinpianchangUrl?.trim()),
  )
}

/** @deprecated Use isPlayablePortfolioVideo. */
export const isPlayableAdditionalVideo = isPlayablePortfolioVideo

/** Original Sanity upload — no width/height downscale. */
function sanityPosterUrl(
  image?: PortfolioVideoThumbnail | SanityImage | null,
): string | undefined {
  if (!image?.asset) return undefined
  return urlForImage(image as SanityImage).url() ?? undefined
}

async function providerPosterUrl(
  parsed: NonNullable<ReturnType<typeof parseVideoUrl>>,
): Promise<string | undefined> {
  if (parsed.provider === 'vimeo') {
    return (await fetchHighestVimeoThumbnailUrl(parsed.url)) ?? undefined
  }
  if (parsed.provider === 'youtube') {
    return youTubePosterUrl(parsed.id, 'maxres')
  }
  return undefined
}

async function resolveSlide(args: {
  key: string
  locale: Locale
  vimeoUrl?: string | null
  xinpianchangUrl?: string | null
  /** Optional per-video player poster override. */
  thumbnail?: PortfolioVideoThumbnail | null
  /** Campaign featured image — used as main-film default when no thumbnail. */
  featuredImage?: SanityImage
  isMainFilm?: boolean
  overlayTitle?: string
  description?: string
  portfolioEntryRef?: string
}): Promise<PortfolioCaseSlide | null> {
  const {
    key,
    locale,
    vimeoUrl,
    xinpianchangUrl,
    thumbnail,
    featuredImage,
    isMainFilm = false,
    overlayTitle,
    description,
    portfolioEntryRef,
  } = args
  const sanityPoster = sanityPosterUrl(
    resolvePortfolioVideoPosterSource({
      thumbnail,
      featuredImage,
      isMainFilm,
    }),
  )
  const parsed = vimeoUrl?.trim() ? parseVideoUrl(vimeoUrl) : null
  const providerPoster =
    sanityPoster || !parsed ? undefined : await providerPosterUrl(parsed)
  const posterUrl = sanityPoster ?? providerPoster
  const title = overlayTitle?.trim() || undefined
  const body = description?.trim() || undefined

  if (
    locale === 'zh' &&
    xinpianchangUrl &&
    xinpianchangToEmbedUrl(xinpianchangUrl)
  ) {
    return {
      key,
      kind: 'xinpianchang',
      embedUrl: xinpianchangUrl,
      posterUrl,
      portfolioEntryRef,
      overlayTitle: title,
      description: body,
    }
  }

  if (!vimeoUrl?.trim() || !parsed) return null

  if (parsed.provider === 'youtube') {
    return {
      key,
      kind: 'youtube',
      videoId: parsed.id,
      posterUrl: posterUrl ?? youTubePosterUrl(parsed.id, 'hq'),
      portfolioEntryRef,
      overlayTitle: title,
      description: body,
    }
  }

  if (parsed.provider === 'vimeo') {
    return {
      key,
      kind: 'vimeo',
      vimeoUrl: parsed.url,
      posterUrl,
      portfolioEntryRef,
      overlayTitle: title,
      description: body,
    }
  }

  return null
}

/**
 * Returns slides for the case carousel, or null when the campaign should keep
 * the single PortfolioVideoEmbed (only one playable film).
 */
export async function buildPortfolioCaseSlides(
  args: {
    locale: Locale
    phrases?: Record<string, string> | null
    portfolioEntryRef?: string
    featuredImage?: SanityImage
    /** Campaign-level description shown beside the main film when set. */
    description?: string | null
    descriptionZh?: string | null
  } & PortfolioVideoSource,
): Promise<PortfolioCaseSlide[] | null> {
  const {
    locale,
    phrases,
    portfolioEntryRef,
    featuredImage,
    description,
    descriptionZh,
    ...videoSource
  } = args

  const videos = resolvePortfolioVideos(videoSource).filter((video) =>
    isPlayablePortfolioVideo(video, locale),
  )
  if (videos.length < 2) return null

  const [mainVideo, ...rest] = videos
  if (!mainVideo) return null

  const mainOverlay = pickLocaleFieldWithPhrases(
    locale,
    mainVideo.videoTitle,
    mainVideo.videoTitleZh,
    phrases,
  ).trim()
  const mainDescription = pickLocaleFieldWithPhrases(
    locale,
    mainVideo.description ?? description,
    mainVideo.descriptionZh ?? descriptionZh,
    phrases,
  ).trim()

  const main = await resolveSlide({
    key: mainVideo._key || 'main',
    locale,
    vimeoUrl: mainVideo.vimeoUrl,
    xinpianchangUrl: mainVideo.xinpianchangUrl,
    thumbnail: mainVideo.thumbnail,
    featuredImage,
    isMainFilm: true,
    overlayTitle: mainOverlay || undefined,
    description: mainDescription || undefined,
    portfolioEntryRef,
  })
  if (!main) return null

  const extras = (
    await Promise.all(
      rest.map((video, index) => {
        const episodeTitle = pickLocaleFieldWithPhrases(
          locale,
          video.videoTitle,
          video.videoTitleZh,
          phrases,
        ).trim()
        const episodeDescription = pickLocaleFieldWithPhrases(
          locale,
          video.description,
          video.descriptionZh,
          phrases,
        ).trim()
        return resolveSlide({
          key: video._key || `additional-${index}`,
          locale,
          vimeoUrl: video.vimeoUrl,
          xinpianchangUrl: video.xinpianchangUrl,
          thumbnail: video.thumbnail,
          overlayTitle: episodeTitle || undefined,
          description: episodeDescription || undefined,
          portfolioEntryRef,
        })
      }),
    )
  ).filter((slide): slide is PortfolioCaseSlide => slide != null)

  if (extras.length === 0) return null
  return [main, ...extras]
}
