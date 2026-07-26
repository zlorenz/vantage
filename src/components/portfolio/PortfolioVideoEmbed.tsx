/**
 * PortfolioVideoEmbed — locale-aware lazy video.
 *
 * EN (and ZH fallback): Vimeo or YouTube from `vimeoUrl`.
 * ZH: Xinpianchang when set; otherwise same as EN.
 *
 * Vimeo posters use the video’s Vimeo thumbnail. YouTube uses YouTube posters.
 * Featured image is only a fallback for Xinpianchang embeds.
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
  featuredImage?: SanityImage;
}

export async function PortfolioVideoEmbed({
  locale,
  vimeoUrl,
  xinpianchangUrl,
  featuredImage,
}: PortfolioVideoEmbedProps) {
  const t = await getTranslations('Portfolio');

  const parsed = vimeoUrl?.trim() ? parseVideoUrl(vimeoUrl) : null;
  const vimeoPoster =
    parsed?.provider === 'vimeo' ? (vimeoThumbnailUrl(parsed.url) ?? undefined) : undefined;
  const featuredPoster = featuredImage
    ? urlForImage(featuredImage).width(1280).height(720).fit('crop').url()
    : undefined;

  if (
    locale === 'zh' &&
    xinpianchangUrl &&
    xinpianchangToEmbedUrl(xinpianchangUrl)
  ) {
    return (
      <LazyXinpianchangPlayer
        embedUrl={xinpianchangUrl}
        posterUrl={featuredPoster ?? vimeoPoster}
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
    return <LazyYouTubePlayer videoId={parsed.id} />;
  }

  if (parsed?.provider === 'vimeo') {
    return <LazyVimeoPlayer vimeoUrl={parsed.url} posterUrl={vimeoPoster} />;
  }

  return (
    <div className="flex aspect-video items-center justify-center bg-black/50 p-4 text-vp-text-soft">
      Invalid video URL
    </div>
  );
}
