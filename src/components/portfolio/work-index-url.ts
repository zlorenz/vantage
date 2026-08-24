/**
 * /work index query helpers — filters, text search, and the active carousel item.
 *
 * `item` is the locale-aware href slug of the centered snap (not a numeric
 * index: filters/search reorder/shorten the list). Written with replaceState so
 * browser Back from a portfolio page remounts on the same card.
 *
 * `q` is a committed search string (Enter / →). Taxonomy filters and search are
 * mutually exclusive at the UI layer; this module still accepts both so URL
 * restore stays a single pipeline.
 */

import type {PublicFilters} from './PortfolioGrid';

export const WORK_INDEX_ITEM_PARAM = 'item';
export const WORK_INDEX_SEARCH_PARAM = 'q';

export type WorkIndexFilterSlide = {
  hrefSlug: string;
  isAppendedFeatured?: boolean;
  videoFormatSlugs: string[];
  industrySlugs: string[];
  marketSlugs: string[];
  /**
   * Lowercased haystack of brand + product + campaign + director names.
   * Built at slide-prep time so client filtering stays sync/cheap.
   */
  searchHaystack?: string;
};

export function readWorkIndexItem(params: URLSearchParams): string {
  return params.get(WORK_INDEX_ITEM_PARAM)?.trim() || '';
}

export function readWorkIndexSearch(params: URLSearchParams): string {
  return params.get(WORK_INDEX_SEARCH_PARAM)?.trim() || '';
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

function slideMatchesSearch(
  slide: WorkIndexFilterSlide,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (slide.searchHaystack ?? '').includes(needle);
}

export function filterPortfolioIndexSlides<T extends WorkIndexFilterSlide>(
  slides: T[],
  filters: PublicFilters,
  searchQuery = '',
): T[] {
  const hasActiveFilters = Boolean(
    filters.format || filters.industry || filters.market,
  );
  const hasSearch = Boolean(searchQuery.trim());
  return slides.filter((slide) => {
    if ((hasActiveFilters || hasSearch) && slide.isAppendedFeatured) {
      return false;
    }
    if (!slideMatchesPublicFilters(slide, filters)) return false;
    return slideMatchesSearch(slide, searchQuery);
  });
}

export function resolveWorkIndexStartIndex(
  slides: WorkIndexFilterSlide[],
  filters: PublicFilters,
  itemSlug: string,
  searchQuery = '',
): number {
  const filtered = filterPortfolioIndexSlides(slides, filters, searchQuery);
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

/** Omit empty search so a fresh /work URL stays clean. */
export function workIndexSearchQuery(query: string): Record<string, string> {
  const trimmed = query.trim();
  if (!trimmed) return {};
  return {[WORK_INDEX_SEARCH_PARAM]: trimmed};
}
