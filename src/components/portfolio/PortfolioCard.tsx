/**
 * PortfolioCard — thumbnail card with gradient overlay and reveal animation.
 *
 * Server component. Links to locale-aware portfolio single route via next-intl.
 */

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { urlForImage } from '@/lib/sanity';
import type { PortfolioCard as PortfolioCardData } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

interface PortfolioCardProps {
  entry: PortfolioCardData;
  locale: Locale;
  /** Stagger index for vp-card-reveal animation delay (× 40ms). */
  revealIndex?: number;
}

export function PortfolioCard({ entry, locale, revealIndex = 0 }: PortfolioCardProps) {
  const slugParam =
    locale === 'zh' ? entry.slugZh || entry.slug : entry.slug;

  const imageUrl = urlForImage(entry.featuredImage)
    .width(960)
    .height(540)
    .fit('crop')
    .url();

  return (
    <article
      className="vp-card vp-card-reveal"
      style={{ animationDelay: `${revealIndex * 40}ms` }}
    >
      <Link
        href={{
          pathname: '/portfolio/[slug]',
          params: { slug: slugParam },
        }}
        className="vp-card__link block text-white no-underline"
      >
        <div className="vp-card__media relative aspect-video w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 575px) 100vw, (max-width: 992px) 50vw, 25vw"
            className="object-cover"
          />
          <div className="vp-card__overlay" aria-hidden />
          <h2
            className="vp-card__title"
            dangerouslySetInnerHTML={{ __html: entry.thumbTitle }}
          />
        </div>
      </Link>
    </article>
  );
}
