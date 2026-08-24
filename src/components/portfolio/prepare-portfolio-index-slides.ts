/**
 * Server-side slide prep for the Full Portfolio Index carousel.
 * Resolves poster URLs and brand/campaign overlay copy before the client Embla shell.
 */

import {phraseRecordToMap} from '@phrase-book';
import {composeOverlayCopy} from '@/components/prototype/carousel/overlay';
import {getStructuredRoleNames} from '@/lib/credits-config';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import {urlForImage} from '@/lib/sanity';
import type {Locale} from '@/i18n/routing';
import type {PortfolioGridEntry, SanityImage} from '@/types/sanity';
import {CAROUSEL_RATIOS, posterSize} from '@carousel-ratios';

/** Newest-first positions treated as already “featured-visible” for append exclusion. */
const FEATURED_APPEND_EXCLUDE_HEAD = 12;

/**
 * Poster dimensions are derived from @carousel-ratios so Studio guides,
 * CSS aspect-ratio, and CDN crops stay in lockstep. 2× DPR = crisp on
 * retina without over-fetching. Fixed integers keep Sanity CDN cache warm.
 */
const WORK_MOBILE_POSTER = posterSize(CAROUSEL_RATIOS.workMobile);
const WORK_DESKTOP_POSTER = posterSize(CAROUSEL_RATIOS.workDesktop);

export type PortfolioIndexSlide = {
  id: string;
  /** Locale-aware portfolio route slug. */
  hrefSlug: string;
  /** Mobile (<576px) — ~2:3 Sanity crop matching the /work card. */
  posterUrl: string;
  /** Desktop (≥576px) — ~520:673 Sanity crop matching the /work card. */
  posterUrlDesktop: string;
  /** CSS object-position from featuredImage hotspot (e.g. "42% 55%"). */
  objectPosition: string;
  /** Brand + product (yellow eyebrow). */
  brandLine: string;
  /** Campaign title, or brand+product when campaign is absent. */
  campaignLine: string;
  /**
   * Lowercased brand + product + campaign + director names for /work search.
   * Built once on the server so Enter-submit filtering stays sync.
   */
  searchHaystack: string;
  videoFormatSlugs: string[];
  industrySlugs: string[];
  marketSlugs: string[];
  /**
   * Tail duplicate of a homepage carouselSlides entry.
   * Distinct `id` from the library occurrence; same hrefSlug / taxonomy fields.
   */
  isAppendedFeatured?: boolean;
};

function objectPositionFromHotspot(hotspot: SanityImage['hotspot'] | undefined): string {
  const x =
    typeof hotspot?.x === 'number' && Number.isFinite(hotspot.x)
      ? Math.min(1, Math.max(0, hotspot.x))
      : 0.5;
  const y =
    typeof hotspot?.y === 'number' && Number.isFinite(hotspot.y)
      ? Math.min(1, Math.max(0, hotspot.y))
      : 0.5;
  return `${x * 100}% ${y * 100}%`;
}

function buildSearchHaystack(
  brandName: string | null | undefined,
  productName: string | null | undefined,
  campaignTitle: string | null | undefined,
  directorNames: string[],
): string {
  return [brandName, productName, campaignTitle, ...directorNames]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Homepage carouselSlides order refs — EN slug + locale-aware href slug. */
export type FeaturedCarouselRef = {
  slug: string;
  hrefSlug: string;
};

export function preparePortfolioIndexSlideFromEntry(
  entry: PortfolioGridEntry,
  locale: Locale,
  phraseMap: ReturnType<typeof phraseRecordToMap>,
): PortfolioIndexSlide | null {
  const slug = entry.slug ?? '';
  const hrefSlug = locale === 'zh' ? entry.slugZh || slug : slug;
  if (!entry.featuredImage || !hrefSlug) return null;

  const posterUrl = urlForImage(entry.featuredImage)
    .width(WORK_MOBILE_POSTER.width)
    .height(WORK_MOBILE_POSTER.height)
    .fit('crop')
    .url();

  const posterUrlDesktop = urlForImage(entry.featuredImage)
    .width(WORK_DESKTOP_POSTER.width)
    .height(WORK_DESKTOP_POSTER.height)
    .fit('crop')
    .url();

  const parts = resolveEntryDisplayTitleParts(entry, locale, phraseMap);
  const {brandLine, campaignLine} = composeOverlayCopy(parts);
  const directorNames = getStructuredRoleNames(
    entry.crewCredits ?? [],
    'director',
  );

  return {
    id: entry._id,
    hrefSlug,
    posterUrl,
    posterUrlDesktop,
    objectPosition: objectPositionFromHotspot(entry.featuredImage.hotspot),
    brandLine,
    campaignLine,
    searchHaystack: buildSearchHaystack(
      parts.brandName,
      parts.productName,
      parts.campaignTitle,
      directorNames,
    ),
    videoFormatSlugs: entry.videoFormatSlugs ?? [],
    industrySlugs: entry.industrySlugs ?? [],
    marketSlugs: entry.marketSlugs ?? [],
  };
}


export function preparePortfolioIndexSlides(
  entries: PortfolioGridEntry[],
  locale: Locale,
  phrases?: Record<string, string>,
): PortfolioIndexSlide[] {
  const phraseMap = phraseRecordToMap(phrases);
  const slides: PortfolioIndexSlide[] = [];

  for (const entry of entries) {
    const slide = preparePortfolioIndexSlideFromEntry(entry, locale, phraseMap);
    if (slide) slides.push(slide);
  }

  return slides;
}

/**
 * Append homepage-curated carouselSlides as tail duplicates (CMS order preserved).
 * Skips any featured hrefSlug already in the first FEATURED_APPEND_EXCLUDE_HEAD
 * newest-first library slides.
 */
export function appendFeaturedPortfolioIndexSlides(
  slides: PortfolioIndexSlide[],
  entries: PortfolioGridEntry[],
  featuredRefs: FeaturedCarouselRef[],
  locale: Locale,
  phrases?: Record<string, string>,
): PortfolioIndexSlide[] {
  if (!featuredRefs.length) return slides;

  const headHrefSlugs = new Set(
    slides.slice(0, FEATURED_APPEND_EXCLUDE_HEAD).map((slide) => slide.hrefSlug),
  );

  const entriesBySlug = new Map<string, PortfolioGridEntry>();
  for (const entry of entries) {
    if (entry.slug) entriesBySlug.set(entry.slug, entry);
  }

  const phraseMap = phraseRecordToMap(phrases);
  const appended: PortfolioIndexSlide[] = [];

  for (const featured of featuredRefs) {
    if (headHrefSlugs.has(featured.hrefSlug)) continue;

    const entry = entriesBySlug.get(featured.slug);
    if (!entry) continue;

    const slide = preparePortfolioIndexSlideFromEntry(entry, locale, phraseMap);
    if (!slide) continue;

    appended.push({
      ...slide,
      id: `${entry._id}--featured-duplicate`,
      isAppendedFeatured: true,
    });
  }

  if (!appended.length) return slides;
  return [...slides, ...appended];
}
