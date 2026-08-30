/**
 * PortfolioCard — thumbnail card with gradient overlay and reveal animation.
 *
 * Server component. Links to locale-aware portfolio single route via next-intl.
 */

import Image from 'next/image';
import type { SanityImageSource } from '@sanity/image-url';
import { PortfolioEntryLink } from '@/components/navigation/PortfolioEntryLink';
import { phraseRecordToMap } from '@phrase-book';
import { resolveEntryDisplayTitles } from '@/lib/display-titles';
import { urlForImage } from '@/lib/sanity';
import type { Locale } from '@/i18n/routing';

/** Accepts TypeGen featured-work rows and hand-typed PortfolioCard. */
export type PortfolioCardEntry = {
  _id: string;
  slug?: string | null;
  slugZh?: string | null;
  displayTitleParts?: {
    brandName?: string | null;
    productName?: string | null;
    campaignTitle?: string | null;
    brandNameZh?: string | null;
    productNameZh?: string | null;
    campaignTitleZh?: string | null;
  } | null;
  thumbTitleOverride?: string | null;
  thumbTitleOverrideZh?: string | null;
  featuredImage?: SanityImageSource | null;
  isHidden?: boolean | null;
};

interface PortfolioCardProps {
  entry: PortfolioCardEntry;
  locale: Locale;
  /** Stagger index for vp-card-reveal animation delay (× 40ms). */
  revealIndex?: number;
  /** Exact EN→ZH phrase book (serializable). */
  phrases?: Record<string, string>;
}

export function PortfolioCard({
  entry,
  locale,
  revealIndex = 0,
  phrases,
}: PortfolioCardProps) {
  const slug = entry.slug ?? '';
  const slugParam = locale === 'zh' ? entry.slugZh || slug : slug;

  if (!entry.featuredImage || !slugParam) return null;

  const imageUrl = urlForImage(entry.featuredImage)
    .width(960)
    .height(540)
    .fit('crop')
    .url();

  const { thumbTitle } = resolveEntryDisplayTitles(
    entry,
    locale,
    phraseRecordToMap(phrases),
  );

  return (
    <article
      className="vp-card vp-card-reveal"
      style={{ animationDelay: `${revealIndex * 40}ms` }}
    >
      <PortfolioEntryLink
        slug={slugParam}
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
            dangerouslySetInnerHTML={{ __html: thumbTitle }}
          />
        </div>
      </PortfolioEntryLink>
    </article>
  );
}
