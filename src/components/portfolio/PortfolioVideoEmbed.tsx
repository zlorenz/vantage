/**
 * PortfolioVideoEmbed — locale-aware lazy video.
 *
 * EN (and ZH fallback): Vimeo or YouTube from `vimeoUrl`.
 * ZH: Xinpianchang when set; otherwise same as EN.
 *
 * When `featuredImage` is passed (main film only), it is preferred as the
 * poster over the low-res Vimeo CDN thumb. Additional videos omit it and keep
 * provider thumbnails.
 */

import { getTranslations } from 'next-intl/server';
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
  /** Main-film Sanity featured image — preferred poster when set. */
  featuredImage?: SanityImage;
}

export async function PortfolioVideoEmbed({
  locale,
  vimeoUrl,
  xinpianchangUrl,
  portfolioEntryRef,
  featuredImage,
}: PortfolioVideoEmbedProps) {
  const t = await getTranslations('Portfolio');

  const parsed = vimeoUrl?.trim() ? parseVideoUrl(vimeoUrl) : null;
  const vimeoPoster =
    parsed?.provider === 'vimeo' ? (vimeoThumbnailUrl(parsed.url) ?? undefined) : undefined;
  const featuredPoster = featuredImage
    ? urlForImage(featuredImage).width(1920).height(1080).fit('crop').url()
    : undefined;
  // Main film: Sanity featured image. Additional films: provider thumb only.
  const posterUrl = featuredPoster ?? vimeoPoster;

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
