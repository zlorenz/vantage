/**
 * Server-side slide prep for the Full Portfolio Index carousel.
 * Resolves poster URLs and brand/campaign overlay copy before the client Embla shell.
 */

import {phraseRecordToMap} from '@phrase-book';
import {composeOverlayCopy} from '@/components/prototype/carousel/overlay';
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles';
import {urlForImage} from '@/lib/sanity';
import type {Locale} from '@/i18n/routing';
import type {PortfolioGridEntry, SanityImage} from '@/types/sanity';

/** Newest-first positions treated as already “featured-visible” for append exclusion. */
const FEATURED_APPEND_EXCLUDE_HEAD = 12;

export type PortfolioIndexSlide = {
  id: string;
  /** Locale-aware portfolio route slug. */
  hrefSlug: string;
  /**
   * Mobile (<576px) — 16:9 Sanity crop. Card is taller (~0.512); CSS object-fit
   * cover + objectPosition does the portrait window (avoids a hard tall CDN crop
   * that reads as over-zoomed).
   */
  posterUrl: string;
  /** Desktop (≥576px) — 4:5 Sanity crop matching card layout; avoids CSS re-crop of 16:9. */
  posterUrlDesktop: string;
  /** CSS object-position from featuredImage hotspot (e.g. "42% 55%"). */
  objectPosition: string;
  /** Brand + product (yellow eyebrow). */
  brandLine: string;
  /** Campaign title, or brand+product when campaign is absent. */
  campaignLine: string;
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
    .width(1920)
    .height(1080)
    .fit('crop')
    .url();

  const posterUrlDesktop = urlForImage(entry.featuredImage)
    .width(1200)
    .height(1500)
    .fit('crop')
    .url();

  const parts = resolveEntryDisplayTitleParts(entry, locale, phraseMap);
  const {brandLine, campaignLine} = composeOverlayCopy(parts);

  return {
    id: entry._id,
    hrefSlug,
    posterUrl,
    posterUrlDesktop,
    objectPosition: objectPositionFromHotspot(entry.featuredImage.hotspot),
    brandLine,
    campaignLine,
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
