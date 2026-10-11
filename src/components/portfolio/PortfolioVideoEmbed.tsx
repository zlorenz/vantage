/**
 * PortfolioVideoEmbed — locale-aware lazy video.
 *
 * EN (and ZH fallback): Vimeo or YouTube from `vimeoUrl`.
 * ZH: Xinpianchang when set; otherwise same as EN.
 *
 * Poster priority (player only — not campaign cards / OG):
 * 1. Per-video `thumbnail` when set
 * 2. Main-film `featuredImage` when passed
 * 3. Provider thumbnail (Vimeo CDN / YouTube)
 */

import { getTranslations } from 'next-intl/server';
import {
  resolvePortfolioVideoPosterSource,
  type PortfolioVideoThumbnail,
} from '@portfolio-videos';
import { LazyYouTubePlayer } from '@/components/ui/LazyYouTubePlayer';
import { urlForImage } from '@/lib/sanity';
import { parseVideoUrl } from '@/lib/video-url';
import { vimeoThumbnailUrl } from '@/lib/vimeo';
import { xinpianchangToEmbedUrl } from '@/lib/xinpianchang';
import type { Locale } from '@/i18n/routing';
import type { SanityImage } from '@/types/sanity';
import { LazyVimeoPlayer } from './LazyVimeoPlayer';
import { LazyXinpianchangPlayer } from './LazyXinpianchangPlayer';

interface PortfolioVideoEmbedProps {
  locale: Locale;
  vimeoUrl: string;
  xinpianchangUrl?: string;
  /** Sanity portfolioEntry document id (weak ref on analytics write). */
  portfolioEntryRef?: string;
  /** Optional per-video player poster override. */
  thumbnail?: PortfolioVideoThumbnail | SanityImage | null;
  /** Main-film Sanity featured image — default poster when no thumbnail. */
  featuredImage?: SanityImage;
  /** When true (default), featuredImage may be used as the poster fallback. */
  isMainFilm?: boolean;
}

export async function PortfolioVideoEmbed({
  locale,
  vimeoUrl,
  xinpianchangUrl,
  portfolioEntryRef,
  thumbnail,
  featuredImage,
  isMainFilm = true,
}: PortfolioVideoEmbedProps) {
  const t = await getTranslations('Portfolio');

  const parsed = vimeoUrl?.trim() ? parseVideoUrl(vimeoUrl) : null;
  const sanityImage = resolvePortfolioVideoPosterSource({
    thumbnail,
    featuredImage,
    isMainFilm,
  });
  const sanityPoster = sanityImage
    ? urlForImage(sanityImage as SanityImage)
        .width(1920)
        .height(1080)
        .fit('crop')
        .url()
    : undefined;
  // Vimeo CDN still when no Sanity poster; YouTube uses LazyYouTubePlayer defaults.
  const providerPoster =
    parsed?.provider === 'vimeo'
      ? (vimeoThumbnailUrl(parsed.url) ?? undefined)
      : undefined;
  const posterUrl = sanityPoster ?? providerPoster;

  if (
    locale === 'zh' &&
    xinpianchangUrl &&
    xinpianchangToEmbedUrl(xinpianchangUrl)
  ) {
    return (
      <LazyXinpianchangPlayer
        embedUrl={xinpianchangUrl}
        posterUrl={posterUrl}
        portfolioEntryRef={portfolioEntryRef}
      />
    );
  }

  if (!vimeoUrl?.trim()) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 p-4 text-vp-text-soft">
        {t('noVideo')}
      </div>
    );
  }

  if (parsed?.provider === 'youtube') {
    return (
      <LazyYouTubePlayer
        videoId={parsed.id}
        posterUrl={posterUrl}
        portfolioEntryRef={portfolioEntryRef}
      />
    );
  }

  if (parsed?.provider === 'vimeo') {
    return (
      <LazyVimeoPlayer
        vimeoUrl={parsed.url}
        posterUrl={posterUrl}
        portfolioEntryRef={portfolioEntryRef}
        priority
      />
    );
  }

  return (
    <div className="flex aspect-video items-center justify-center bg-black/50 p-4 text-vp-text-soft">
      Invalid video URL
    </div>
  );
}
