/**
 * Server-side slide prep for the Full Portfolio Index carousel.
 * Resolves poster URLs and brand/campaign overlay copy before the client Embla shell.
 */

import {phraseRecordToMap} from '@phrase-book';
import {composeOverlayCopy} from '@/components/prototype/carousel/overlay';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import {urlForImage} from '@/lib/sanity';
import type {Locale} from '@/i18n/routing';
import type {PortfolioGridEntry} from '@/types/sanity';

export type PortfolioIndexSlide = {
  id: string;
  /** Locale-aware portfolio route slug. */
  hrefSlug: string;
  posterUrl: string;
  /** Brand + product (yellow eyebrow). */
  brandLine: string;
  /** Campaign title, or brand+product when campaign is absent. */
  campaignLine: string;
  videoFormatSlugs: string[];
  industrySlugs: string[];
  marketSlugs: string[];
};

export function preparePortfolioIndexSlides(
  entries: PortfolioGridEntry[],
  locale: Locale,
  phrases?: Record<string, string>,
): PortfolioIndexSlide[] {
  const phraseMap = phraseRecordToMap(phrases);
  const slides: PortfolioIndexSlide[] = [];

  for (const entry of entries) {
    const slug = entry.slug ?? '';
    const hrefSlug = locale === 'zh' ? entry.slugZh || slug : slug;
    if (!entry.featuredImage || !hrefSlug) continue;

    const posterUrl = urlForImage(entry.featuredImage)
      .width(1920)
      .height(1080)
      .fit('crop')
      .url();

    const parts = resolveEntryDisplayTitleParts(entry, locale, phraseMap);
    const {brandLine, campaignLine} = composeOverlayCopy(parts);

    slides.push({
      id: entry._id,
      hrefSlug,
      posterUrl,
      brandLine,
      campaignLine,
      videoFormatSlugs: entry.videoFormatSlugs ?? [],
      industrySlugs: entry.industrySlugs ?? [],
      marketSlugs: entry.marketSlugs ?? [],
    });
  }

  return slides;
}
