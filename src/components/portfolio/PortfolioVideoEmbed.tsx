/**
 * PortfolioVideoEmbed — locale-aware lazy video (Vimeo or Xinpianchang on ZH).
 *
 * Primary rows pass `featuredImage` (campaign still). Additional rows omit it
 * and get a per-video Vimeo thumbnail so multi-video campaigns don’t all show
 * the hero frame.
 */

import { getTranslations } from 'next-intl/server';
import { urlForImage } from '@/lib/sanity';
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

  const posterUrl =
    (featuredImage
      ? urlForImage(featuredImage).width(1280).height(720).fit('crop').url()
      : undefined) ??
    (vimeoUrl?.trim() ? vimeoThumbnailUrl(vimeoUrl) : null) ??
    undefined;

  if (
    locale === 'zh' &&
    xinpianchangUrl &&
    xinpianchangToEmbedUrl(xinpianchangUrl)
  ) {
    return (
      <LazyXinpianchangPlayer
        embedUrl={xinpianchangUrl}
        posterUrl={posterUrl}
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

  return <LazyVimeoPlayer vimeoUrl={vimeoUrl} posterUrl={posterUrl} />;
}
