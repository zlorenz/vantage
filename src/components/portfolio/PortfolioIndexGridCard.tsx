/**
 * Portfolio index grid card - same chrome as /work?view=grid and /search.
 *
 * Server component. Brand (yellow) + campaign overlay, corner hover brackets.
 */

import Image from 'next/image';
import type { SanityImageSource } from '@sanity/image-url';
import { PortfolioEntryLink } from '@/components/navigation/PortfolioEntryLink';
import { composeOverlayCopy } from '@/components/prototype/carousel/overlay';
import { PortfolioIndexGridHover } from '@/components/portfolio/PortfolioIndexGridHover';
import { phraseRecordToMap } from '@phrase-book';
import {
  resolveEntryDisplayTitleParts,
  resolveEntryDocumentTitle,
} from '@/lib/display-titles';
import { urlForImage } from '@/lib/sanity';
import type { Locale } from '@/i18n/routing';
import '@/components/portfolio/portfolio-index-grid.css';

export type PortfolioIndexGridCardEntry = {
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
  title?: string | null;
  titleZh?: string | null;
  featuredImage?: SanityImageSource | null;
};

interface PortfolioIndexGridCardProps {
  entry: PortfolioIndexGridCardEntry;
  locale: Locale;
  phrases?: Record<string, string>;
}

export function PortfolioIndexGridCard({
  entry,
  locale,
  phrases,
}: PortfolioIndexGridCardProps) {
  const slug = entry.slug ?? '';
  const slugParam = locale === 'zh' ? entry.slugZh || slug : slug;

  if (!entry.featuredImage || !slugParam) return null;

  const imageUrl = urlForImage(entry.featuredImage)
    .width(960)
    .height(540)
    .fit('crop')
    .url();

  const phraseMap = phrases ? phraseRecordToMap(phrases) : null;
  const parts = resolveEntryDisplayTitleParts(entry, locale, phraseMap);
  const { brandLine, campaignLine } = composeOverlayCopy(parts);
  const campaign =
    campaignLine && campaignLine !== brandLine ? campaignLine : '';
  const fallbackTitle =
    !brandLine && !campaign
      ? resolveEntryDocumentTitle(entry, locale, phraseMap)
      : '';
  const campaignText = campaign || fallbackTitle;

  return (
    <li className="vp-portfolio-index__grid-item">
      <PortfolioEntryLink
        slug={slugParam}
        className="vp-portfolio-index__grid-link"
      >
        <div className="vp-portfolio-index__grid-media">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(min-width: 2800px) 25vw, (min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="vp-portfolio-index__grid-poster"
          />
          {brandLine || campaignText ? (
            <div className="vp-portfolio-index__grid-copy">
              {brandLine ? (
                <p className="vp-portfolio-index__grid-brand">{brandLine}</p>
              ) : null}
              {campaignText ? (
                <p className="vp-portfolio-index__grid-campaign">{campaignText}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <PortfolioIndexGridHover />
      </PortfolioEntryLink>
    </li>
  );
}
