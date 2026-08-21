/**
 * Server-side slide prep for the Full Portfolio Index carousel.
 * Resolves poster URLs and display titles before handing off to the client Embla shell.
 */

import {phraseRecordToMap} from '@phrase-book';
import {resolveEntryDisplayTitles} from '@/lib/display-titles';
import {urlForImage} from '@/lib/sanity';
import type {Locale} from '@/i18n/routing';
import type {PortfolioGridEntry} from '@/types/sanity';

export type PortfolioIndexSlide = {
  id: string;
  /** Locale-aware portfolio route slug. */
  hrefSlug: string;
  posterUrl: string;
  titleHtml: string;
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
      .width(1600)
      .height(900)
      .fit('crop')
      .url();

    const {thumbTitle} = resolveEntryDisplayTitles(entry, locale, phraseMap);

    slides.push({
      id: entry._id,
      hrefSlug,
      posterUrl,
      titleHtml: thumbTitle,
    });
  }

  return slides;
}
