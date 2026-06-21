/**
 * PortfolioVideoEmbed — locale-aware lazy video (Vimeo or Xinpianchang on ZH).
 */

import { urlForImage } from '@/lib/sanity';
import { xinpianchangToEmbedUrl } from '@/lib/xinpianchang';
import type { Locale } from '@/i18n/routing';
import type { SanityImage } from '@/types/sanity';
import { LazyVimeoPlayer } from './LazyVimeoPlayer';
import { LazyXinpianchangPlayer } from './LazyXinpianchangPlayer';

interface PortfolioVideoEmbedProps {
  locale: Locale;
  vimeoUrl: string;
  xinpianchangUrl?: string;
  featuredImage: SanityImage;
}

export function PortfolioVideoEmbed({
  locale,
  vimeoUrl,
  xinpianchangUrl,
  featuredImage,
}: PortfolioVideoEmbedProps) {
  const posterUrl = urlForImage(featuredImage).width(1280).height(720).fit('crop').url();

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
        No video embed found for this portfolio item.
      </div>
    );
  }

  return <LazyVimeoPlayer vimeoUrl={vimeoUrl} posterUrl={posterUrl} />;
}
