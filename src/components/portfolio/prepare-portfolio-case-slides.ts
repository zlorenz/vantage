/**
 * Build serializable slide props for PortfolioCaseCarousel.
 *
 * Slide 0 = main film (full-resolution featuredImage as poster when set).
 * Slides 1+ = playable additionalVideos (highest-res Vimeo still / YouTube maxres).
 *
 * Overlay titles are plain episode strings only (heroFilmTitle / videoTitle) —
 * never the composed Brand+Product+Campaign long title.
 */

import {urlForImage} from '@/lib/sanity';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import {parseVideoUrl, youTubePosterUrl} from '@/lib/video-url';
import {fetchHighestVimeoThumbnailUrl} from '@/lib/vimeo';
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang';
import type {Locale} from '@/i18n/routing';
import type {AdditionalVideo, SanityImage} from '@/types/sanity';

type SlideBase = {
  key: string;
  /** Plain film/episode title for card overlay; omit when empty. */
  overlayTitle?: string;
  /** Locale-resolved description for desktop “more info” panel; omit when empty. */
  description?: string;
};

export type PortfolioCaseSlide = SlideBase &
  (
    | {
        kind: 'vimeo';
        vimeoUrl: string;
        posterUrl?: string;
        portfolioEntryRef?: string;
      }
    | {
        kind: 'youtube';
        videoId: string;
        posterUrl: string;
        portfolioEntryRef?: string;
      }
    | {
        kind: 'xinpianchang';
        embedUrl: string;
        posterUrl?: string;
        portfolioEntryRef?: string;
      }
  );

export function isPlayableAdditionalVideo(
  video: Pick<AdditionalVideo, 'vimeoUrl' | 'xinpianchangUrl'>,
  locale: Locale,
): boolean {
  return Boolean(
    video.vimeoUrl?.trim() ||
      (locale === 'zh' && video.xinpianchangUrl?.trim()),
  );
}

/** Original Sanity upload — no width/height downscale. */
function featuredPosterUrl(featuredImage?: SanityImage): string | undefined {
  if (!featuredImage) return undefined;
  return urlForImage(featuredImage).url() ?? undefined;
}

async function providerPosterUrl(
  parsed: NonNullable<ReturnType<typeof parseVideoUrl>>,
): Promise<string | undefined> {
  if (parsed.provider === 'vimeo') {
    return (await fetchHighestVimeoThumbnailUrl(parsed.url)) ?? undefined;
  }
  if (parsed.provider === 'youtube') {
    return youTubePosterUrl(parsed.id, 'maxres');
  }
  return undefined;
}

async function resolveSlide(args: {
  key: string;
  locale: Locale;
  vimeoUrl?: string | null;
  xinpianchangUrl?: string | null;
  /** Preferred poster (main film only) — full-res Sanity featured image. */
  featuredImage?: SanityImage;
  overlayTitle?: string;
  description?: string;
  portfolioEntryRef?: string;
}): Promise<PortfolioCaseSlide | null> {
  const {
    key,
    locale,
    vimeoUrl,
    xinpianchangUrl,
    featuredImage,
    overlayTitle,
    description,
    portfolioEntryRef,
  } = args;
  const featured = featuredPosterUrl(featuredImage);
  const parsed = vimeoUrl?.trim() ? parseVideoUrl(vimeoUrl) : null;
  const providerPoster =
    featured || !parsed ? undefined : await providerPosterUrl(parsed);
  const posterUrl = featured ?? providerPoster;
  const title = overlayTitle?.trim() || undefined;
  const body = description?.trim() || undefined;

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
    };
  }

  if (!vimeoUrl?.trim() || !parsed) return null;

  if (parsed.provider === 'youtube') {
    return {
      key,
      kind: 'youtube',
      videoId: parsed.id,
      posterUrl: posterUrl ?? youTubePosterUrl(parsed.id, 'hq'),
      portfolioEntryRef,
      overlayTitle: title,
      description: body,
    };
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
    };
  }

  return null;
}

/**
 * Returns slides for the case carousel, or null when the campaign should keep
 * the single PortfolioVideoEmbed (no playable additional videos).
 */
export async function buildPortfolioCaseSlides(args: {
  locale: Locale;
  phrases?: Record<string, string> | null;
  portfolioEntryRef?: string;
  vimeoUrl: string;
  xinpianchangUrl?: string | null;
  featuredImage?: SanityImage;
  heroFilmTitle?: string | null;
  heroFilmTitleZh?: string | null;
  description?: string | null;
  descriptionZh?: string | null;
  additionalVideos?: AdditionalVideo[] | null;
}): Promise<PortfolioCaseSlide[] | null> {
  const {
    locale,
    phrases,
    portfolioEntryRef,
    vimeoUrl,
    xinpianchangUrl,
    featuredImage,
    heroFilmTitle,
    heroFilmTitleZh,
    description,
    descriptionZh,
    additionalVideos,
  } = args;

  const playableAdditional = (additionalVideos ?? []).filter((video) =>
    isPlayableAdditionalVideo(video, locale),
  );
  if (playableAdditional.length === 0) return null;

  const mainOverlay = pickLocaleFieldWithPhrases(
    locale,
    heroFilmTitle,
    heroFilmTitleZh,
    phrases,
  ).trim();
  const mainDescription = pickLocaleFieldWithPhrases(
    locale,
    description,
    descriptionZh,
    phrases,
  ).trim();

  const main = await resolveSlide({
    key: 'main',
    locale,
    vimeoUrl,
    xinpianchangUrl,
    featuredImage,
    overlayTitle: mainOverlay || undefined,
    description: mainDescription || undefined,
    portfolioEntryRef,
  });
  if (!main) return null;

  const extras = (
    await Promise.all(
      playableAdditional.map((video, index) => {
        const episodeTitle = pickLocaleFieldWithPhrases(
          locale,
          video.videoTitle,
          video.videoTitleZh,
          phrases,
        ).trim();
        const episodeDescription = pickLocaleFieldWithPhrases(
          locale,
          video.description,
          video.descriptionZh,
          phrases,
        ).trim();
        return resolveSlide({
          key: `additional-${index}`,
          locale,
          vimeoUrl: video.vimeoUrl,
          xinpianchangUrl: video.xinpianchangUrl,
          overlayTitle: episodeTitle || undefined,
          description: episodeDescription || undefined,
          portfolioEntryRef,
        });
      }),
    )
  ).filter((slide): slide is PortfolioCaseSlide => slide != null);

  if (extras.length === 0) return null;
  return [main, ...extras];
}
