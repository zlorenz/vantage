/**
 * /work index query helpers — filters plus the active carousel item.
 *
 * `item` is the locale-aware href slug of the centered snap (not a numeric
 * index: filters reorder/shorten the list). Written with replaceState so
 * browser Back from a portfolio page remounts on the same card.
 */

import type {PublicFilters} from './PortfolioGrid';

export const WORK_INDEX_ITEM_PARAM = 'item';

export type WorkIndexFilterSlide = {
  hrefSlug: string;
  isAppendedFeatured?: boolean;
  videoFormatSlugs: string[];
  industrySlugs: string[];
  marketSlugs: string[];
};

export function readWorkIndexItem(params: URLSearchParams): string {
  return params.get(WORK_INDEX_ITEM_PARAM)?.trim() || '';
}

function slideMatchesPublicFilters(
  slide: WorkIndexFilterSlide,
  filters: PublicFilters,
): boolean {
  if (filters.format && !slide.videoFormatSlugs.includes(filters.format)) {
    return false;
  }
  if (filters.industry && !slide.industrySlugs.includes(filters.industry)) {
    return false;
  }
  if (filters.market && !slide.marketSlugs.includes(filters.market)) {
    return false;
  }
  return true;
}

export function filterPortfolioIndexSlides<T extends WorkIndexFilterSlide>(
  slides: T[],
  filters: PublicFilters,
): T[] {
  const hasActiveFilters = Boolean(
    filters.format || filters.industry || filters.market,
  );
  return slides.filter((slide) => {
    if (hasActiveFilters && slide.isAppendedFeatured) return false;
    return slideMatchesPublicFilters(slide, filters);
  });
}

export function resolveWorkIndexStartIndex(
  slides: WorkIndexFilterSlide[],
  filters: PublicFilters,
  itemSlug: string,
): number {
  const filtered = filterPortfolioIndexSlides(slides, filters);
  if (!itemSlug || filtered.length === 0) return 0;
  const index = filtered.findIndex((entry) => entry.hrefSlug === itemSlug);
  return index >= 0 ? index : 0;
}

/** Omit `item` at snap 0 so a fresh /work URL stays clean. */
export function workIndexItemQuery(
  slug: string | undefined,
  index: number,
): Record<string, string> {
  if (index <= 0 || !slug) return {};
  return {[WORK_INDEX_ITEM_PARAM]: slug};
}
