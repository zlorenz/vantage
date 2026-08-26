/**
 * Build serializable slide props for PortfolioCaseCarousel.
 *
 * Slide 0 = main film (featuredImage preferred as poster).
 * Slides 1+ = playable additionalVideos (provider thumb only).
 */

import {urlForImage} from '@/lib/sanity';
import {parseVideoUrl, youTubePosterUrl} from '@/lib/video-url';
import {vimeoThumbnailUrl} from '@/lib/vimeo';
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang';
import type {Locale} from '@/i18n/routing';
import type {AdditionalVideo, SanityImage} from '@/types/sanity';

export type PortfolioCaseSlide =
  | {
      key: string;
      kind: 'vimeo';
      vimeoUrl: string;
      posterUrl?: string;
    }
  | {
      key: string;
      kind: 'youtube';
      videoId: string;
      posterUrl: string;
    }
  | {
      key: string;
      kind: 'xinpianchang';
      embedUrl: string;
      posterUrl?: string;
    };

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
}): PortfolioCaseSlide | null {
  const {key, locale, vimeoUrl, xinpianchangUrl, featuredImage} = args;
  const featured = featuredPosterUrl(featuredImage);
  const parsed = vimeoUrl?.trim() ? parseVideoUrl(vimeoUrl) : null;
  const providerPoster =
    parsed?.provider === 'vimeo'
      ? (vimeoThumbnailUrl(parsed.url) ?? undefined)
      : parsed?.provider === 'youtube'
        ? youTubePosterUrl(parsed.id, 'maxres')
        : undefined;
  const posterUrl = featured ?? providerPoster;

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
    };
  }

  if (!vimeoUrl?.trim() || !parsed) return null;

  if (parsed.provider === 'youtube') {
    return {
      key,
      kind: 'youtube',
      videoId: parsed.id,
      posterUrl: posterUrl ?? youTubePosterUrl(parsed.id, 'hq'),
    };
  }

  if (parsed.provider === 'vimeo') {
    return {
      key,
      kind: 'vimeo',
      vimeoUrl: parsed.url,
      posterUrl,
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
  vimeoUrl: string;
  xinpianchangUrl?: string | null;
  featuredImage?: SanityImage;
  additionalVideos?: AdditionalVideo[] | null;
}): PortfolioCaseSlide[] | null {
  const {
    locale,
    vimeoUrl,
    xinpianchangUrl,
    featuredImage,
    additionalVideos,
  } = args;

  const playableAdditional = (additionalVideos ?? []).filter((video) =>
    isPlayableAdditionalVideo(video, locale),
  );
  if (playableAdditional.length === 0) return null;

  const main = resolveSlide({
    key: 'main',
    locale,
    vimeoUrl,
    xinpianchangUrl,
    featuredImage,
  });
  if (!main) return null;

  const extras: PortfolioCaseSlide[] = [];
  playableAdditional.forEach((video, index) => {
    const slide = resolveSlide({
      key: `additional-${index}`,
      locale,
      vimeoUrl: video.vimeoUrl,
      xinpianchangUrl: video.xinpianchangUrl,
    });
    if (slide) extras.push(slide);
  });

  if (extras.length === 0) return null;
  return [main, ...extras];
}
