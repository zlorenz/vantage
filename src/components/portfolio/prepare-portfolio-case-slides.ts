/**
 * Build serializable slide props for PortfolioCaseCarousel.
 *
 * Slide 0 = main film (featuredImage preferred as poster).
 * Slides 1+ = playable additionalVideos (provider thumb only).
 *
 * Overlay titles are plain episode strings only (heroFilmTitle / videoTitle) —
 * never the composed Brand+Product+Campaign long title.
 */

import {urlForImage} from '@/lib/sanity';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import {parseVideoUrl, youTubePosterUrl} from '@/lib/video-url';
import {vimeoThumbnailUrl} from '@/lib/vimeo';
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
      }
    | {
        kind: 'youtube';
        videoId: string;
        posterUrl: string;
      }
    | {
        kind: 'xinpianchang';
        embedUrl: string;
        posterUrl?: string;
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

function featuredPosterUrl(featuredImage?: SanityImage): string | undefined {
  if (!featuredImage) return undefined;
  return urlForImage(featuredImage).width(1920).height(1080).fit('crop').url();
}

function resolveSlide(args: {
  key: string;
  locale: Locale;
  vimeoUrl?: string | null;
  xinpianchangUrl?: string | null;
  /** Preferred poster (main film only). */
  featuredImage?: SanityImage;
  overlayTitle?: string;
  description?: string;
}): PortfolioCaseSlide | null {
  const {
    key,
    locale,
    vimeoUrl,
    xinpianchangUrl,
    featuredImage,
    overlayTitle,
    description,
  } = args;
  const featured = featuredPosterUrl(featuredImage);
  const parsed = vimeoUrl?.trim() ? parseVideoUrl(vimeoUrl) : null;
  const providerPoster =
    parsed?.provider === 'vimeo'
      ? (vimeoThumbnailUrl(parsed.url) ?? undefined)
      : parsed?.provider === 'youtube'
        ? youTubePosterUrl(parsed.id, 'maxres')
        : undefined;
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
export function buildPortfolioCaseSlides(args: {
  locale: Locale;
  phrases?: Record<string, string> | null;
  vimeoUrl: string;
  xinpianchangUrl?: string | null;
  featuredImage?: SanityImage;
  heroFilmTitle?: string | null;
  heroFilmTitleZh?: string | null;
  description?: string | null;
  descriptionZh?: string | null;
  additionalVideos?: AdditionalVideo[] | null;
}): PortfolioCaseSlide[] | null {
  const {
    locale,
    phrases,
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

  const main = resolveSlide({
    key: 'main',
    locale,
    vimeoUrl,
    xinpianchangUrl,
    featuredImage,
    overlayTitle: mainOverlay || undefined,
    description: mainDescription || undefined,
  });
  if (!main) return null;

  const extras: PortfolioCaseSlide[] = [];
  playableAdditional.forEach((video, index) => {
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
    const slide = resolveSlide({
      key: `additional-${index}`,
      locale,
      vimeoUrl: video.vimeoUrl,
      xinpianchangUrl: video.xinpianchangUrl,
      overlayTitle: episodeTitle || undefined,
      description: episodeDescription || undefined,
    });
    if (slide) extras.push(slide);
  });

  if (extras.length === 0) return null;
  return [main, ...extras];
}
