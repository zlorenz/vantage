'use client';

/**
 * Full Portfolio Index — horizontal peek carousel (Embla).
 *
 * Static posters only (featuredImage). Discrete snap-per-card, centered
 * active slide with left/right peeks, infinite loop. No shared imports from
 * the homepage FeaturedWorkCarousel.
 */

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';
import useEmblaCarousel from 'embla-carousel-react';
import {WheelGestures} from 'wheel-gestures';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import type {PortfolioGridEntry, TaxonomyTerm} from '@/types/sanity';
import {
  matchesPublicFilters,
  readPublicFilters,
  replacePublicFiltersUrl,
  type PublicFilters,
} from './PortfolioGrid';
import {PortfolioIndexFilterSheet} from './PortfolioIndexFilterSheet';
import {PortfolioIndexScrubber} from './PortfolioIndexScrubber';
import type {PortfolioIndexSlide} from './prepare-portfolio-index-slides';
import './portfolio-index-carousel.css';

interface PortfolioIndexCarouselProps {
  slides: PortfolioIndexSlide[];
  locale: Locale;
  phrases?: Record<string, string>;
  videoFormats: TaxonomyTerm[];
  industries: TaxonomyTerm[];
  markets: TaxonomyTerm[];
}

/** Empty presets — /work has no archive lock-in (unlike taxonomy pages). */
const EMPTY_PUBLIC_PRESETS: PublicFilters = {
  format: '',
  industry: '',
  market: '',
};

/** In-gesture |delta| before paging; gesture bounds come from wheel-gestures. */
const WHEEL_GESTURE_THRESHOLD_PX = 30;

/**
 * How many neighbors on each side of the active snap mount a real poster.
 * ±8 → up to 17 poster <picture> elements at once (fewer when slideCount is smaller).
 * Nested under the content window — posters only mount when the Link shell
 * is present, so the effective poster set is min(poster, content).
 */
const POSTER_WINDOW_RADIUS = 8;

/**
 * How many neighbors get radius/overflow/transform/transition styling.
 * Tighter than the image window: peek layout only shows ~3 cards on screen;
 * ±2 → 5 styled cards (active + peeks + one-step buffer). Restyling is a
 * class toggle (cheap); image decode still uses the wider ±8 buffer.
 */
const STYLE_WINDOW_RADIUS = 2;

/**
 * How many neighbors mount full slide content (Link + overlay + title).
 * Matches the style window so tappable peeks always have a real href, while
 * far Embla shells stay empty measured boxes (no Link/title/overlay nodes).
 */
const CONTENT_WINDOW_RADIUS = 2;

/**
 * Loop needs enough slides to build clones. Sparse filtered sets (1–3) stay
 * non-looping. Embla’s default containScroll: 'trimSnaps' then pins the first
 * snap to the start — a single card sits left instead of the active center.
 */
function portfolioIndexEmblaOptions(slideCount: number) {
  const loop = slideCount > 3;
  return {
    dragFree: false as const,
    loop,
    align: 'center' as const,
    containScroll: loop ? ('trimSnaps' as const) : (false as const),
  };
}

/**
 * Loop-aware circular distance for /work index windowing.
 * Local to this file (not imported from homepage carousel types).
 */
function isWithinCircularWindow(
  index: number,
  activeIndex: number,
  slideCount: number,
  radius: number,
): boolean {
  if (slideCount <= 0) return false;
  if (slideCount <= radius * 2 + 1) return true;
  const dist = Math.abs(index - activeIndex);
  return Math.min(dist, slideCount - dist) <= radius;
}

/**
 * Nearest snap from Embla scrollProgress.
 * Loop: circular distance on [0,1) — linear |snap - progress| sticks on the
 * last index across the wrap (progress crawls 0.99→1 then jumps to 0).
 * Non-loop: linear distance. Wrapping progress=1 onto [0,1) maps the last
 * snap back to 0, which is why a 2-card filter kept the first card active.
 * Also required while scrubbing: selectedScrollSnap() does not advance until
 * settle, so progress-based nearest is what keeps is-active + windowing live.
 */
function nearestSnapIndexFromProgress(
  progress: number,
  snaps: number[],
  loop: boolean,
): number {
  if (snaps.length <= 1) return 0;
  if (!loop) {
    const clamped = Math.min(1, Math.max(0, progress));
    let nearest = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < snaps.length; i++) {
      const dist = Math.abs(snaps[i] - clamped);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = i;
      }
    }
    return nearest;
  }
  const norm = ((progress % 1) + 1) % 1;
  let nearest = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < snaps.length; i++) {
    const dist = Math.abs(snaps[i] - norm);
    const circular = Math.min(dist, 1 - dist);
    if (circular < bestDist) {
      bestDist = circular;
      nearest = i;
    }
  }
  return nearest;
}

function shouldMountPortfolioIndexPoster(
  index: number,
  activeIndex: number,
  slideCount: number,
  radius: number = POSTER_WINDOW_RADIUS,
): boolean {
  return isWithinCircularWindow(index, activeIndex, slideCount, radius);
}

function shouldStylePortfolioIndexCard(
  index: number,
  activeIndex: number,
  slideCount: number,
  radius: number = STYLE_WINDOW_RADIUS,
): boolean {
  return isWithinCircularWindow(index, activeIndex, slideCount, radius);
}

function shouldMountPortfolioIndexContent(
  index: number,
  activeIndex: number,
  slideCount: number,
  radius: number = CONTENT_WINDOW_RADIUS,
): boolean {
  return isWithinCircularWindow(index, activeIndex, slideCount, radius);
}

function FunnelIcon() {
  return (
    <svg
      className="vp-portfolio-index__filter-trigger-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M3.5 5.25A.75.75 0 0 1 4.25 4.5h15.5a.75.75 0 0 1 .53 1.28l-5.78 5.78v5.69a.75.75 0 0 1-1.13.65l-3.5-2a.75.75 0 0 1-.37-.65v-3.69L3.72 5.78A.75.75 0 0 1 3.5 5.25Z"
      />
    </svg>
  );
}

function slideMatchesPublicFilters(
  slide: PortfolioIndexSlide,
  filters: PublicFilters,
): boolean {
  // Helpers are typed against PortfolioGridEntry; slides carry the same slug arrays.
  return matchesPublicFilters(slide as unknown as PortfolioGridEntry, filters);
}

export function PortfolioIndexCarousel({
  slides,
  locale,
  phrases,
  videoFormats,
  industries,
  markets,
}: PortfolioIndexCarouselProps) {
  const t = useTranslations('Filters');
  const searchParams = useSearchParams();
  const [publicFilters, setPublicFilters] = useState(() =>
    readPublicFilters(searchParams),
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const gestureAccumRef = useRef(0);
  const gestureFiredRef = useRef(false);
  const filterSignatureRef = useRef<string | null>(null);

  const hasActiveFilters = Boolean(
    publicFilters.format || publicFilters.industry || publicFilters.market,
  );
  const filteredSlides = useMemo(
    () =>
      slides.filter((slide) => {
        // Appended homepage duplicates are loop-bridge only — hide whenever any
        // taxonomy filter is active (do not treat them as filterable facets).
        if (hasActiveFilters && slide.isAppendedFeatured) return false;
        return slideMatchesPublicFilters(slide, publicFilters);
      }),
    [slides, publicFilters, hasActiveFilters],
  );
  const librarySlides = useMemo(
    () => slides.filter((slide) => !slide.isAppendedFeatured),
    [slides],
  );
  const slideCount = filteredSlides.length;
  const filterSignature = `${publicFilters.format}|${publicFilters.industry}|${publicFilters.market}`;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    portfolioIndexEmblaOptions(slideCount),
  );

  useEffect(() => {
    replacePublicFiltersUrl(publicFilters, EMPTY_PUBLIC_PRESETS);
  }, [publicFilters]);

  useEffect(() => {
    function onPopState() {
      setPublicFilters(
        readPublicFilters(new URLSearchParams(window.location.search)),
      );
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  /**
   * Keep counter/windowing aligned while Embla animates between snaps
   * (scrub + swipe + loop seam). Progress-based circular nearest — not
   * selectedScrollSnap (stale during scrub) and not linear snap distance
   * (stuck on last index across the loop wrap).
   */
  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const snaps = emblaApi.scrollSnapList();
    if (snaps.length <= 1) return;
    const nearest = nearestSnapIndexFromProgress(
      emblaApi.scrollProgress(),
      snaps,
      Boolean(emblaApi.internalEngine().options.loop),
    );
    setActiveIndex((prev) => (prev === nearest ? prev : nearest));
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('scroll', onScroll);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('scroll', onScroll);
    };
  }, [emblaApi, onSelect, onScroll]);

  /**
   * When filters change, the rendered slide list length/order changes.
   * Re-init Embla against the new DOM, jump to index 0, and let windowing
   * recompute from activeIndex=0 + filtered slideCount (not the full 146).
   * Sparse sets disable loop — Embla can't build a loop engine with only a
   * couple of wide peek slides, which otherwise collapses to a single snap.
   */
  useEffect(() => {
    if (!emblaApi) return;

    const prev = filterSignatureRef.current;
    filterSignatureRef.current = filterSignature;
    if (prev === null || prev === filterSignature) return;

    const resetToStart = () => {
      emblaApi.off('reInit', resetToStart);
      emblaApi.scrollTo(0, true);
      setActiveIndex(0);
    };

    // Prefer the reInit event so scrollTo runs after Embla finishes measuring
    // the new filtered slide nodes (sync scrollTo right after reInit can miss).
    emblaApi.on('reInit', resetToStart);
    emblaApi.reInit(portfolioIndexEmblaOptions(slideCount));
    return () => {
      emblaApi.off('reInit', resetToStart);
    };
  }, [emblaApi, filterSignature, filteredSlides, slideCount]);

  useEffect(() => {
    if (!emblaApi) return;

    const viewport = emblaApi.rootNode();
    const wheelGestures = WheelGestures({
      reverseSign: false,
      preventWheelAction: false,
    });

    const unobserve = wheelGestures.observe(viewport);
    const unsubscribe = wheelGestures.on('wheel', (wheelEventState) => {
      const {isStart, isMomentum, axisDelta, event} = wheelEventState;
      const [deltaX, deltaY] = axisDelta;

      if (isStart) {
        gestureAccumRef.current = 0;
        gestureFiredRef.current = false;
      }

      if (event.ctrlKey) return;

      // Dominant axis: horizontal strip owns both trackpad axes because this
      // route has no vertical page scroll — vertical two-finger swipe also pages.
      const dominant =
        Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
      if (dominant === 0) return;

      event.preventDefault?.();

      if (isMomentum) return;

      gestureAccumRef.current += Math.abs(dominant);
      if (gestureFiredRef.current) return;
      if (gestureAccumRef.current < WHEEL_GESTURE_THRESHOLD_PX) return;

      gestureFiredRef.current = true;
      if (dominant > 0) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollPrev();
      }
    });

    return () => {
      unsubscribe();
      unobserve();
      wheelGestures.disconnect();
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (filterSheetOpen) return;
      if (event.repeat) return;
      const {key} = event;
      if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;

      const target = event.target as HTMLElement | null;
      if (target?.closest?.('.vp-portfolio-index__scrubber')) return;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      if (key === 'ArrowRight') {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollPrev();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [emblaApi, filterSheetOpen]);

  const updatePublicFilter = useCallback(
    (key: keyof PublicFilters, value: string) => {
      setPublicFilters((prev) => ({...prev, [key]: value}));
    },
    [],
  );

  const clearPublicFilters = useCallback(() => {
    setPublicFilters(EMPTY_PUBLIC_PRESETS);
  }, []);

  const closeFilterSheet = useCallback(() => {
    setFilterSheetOpen(false);
  }, []);

  const filterTrigger = (
    <div className="vp-portfolio-index__bottom-bar">
      <div className="vp-portfolio-index__filter-anchor">
        <button
          type="button"
          className={`vp-portfolio-index__filter-trigger${
            hasActiveFilters ? ' is-active' : ''
          }`}
          aria-label={t('filter')}
          aria-expanded={filterSheetOpen}
          aria-pressed={hasActiveFilters}
          onClick={() => setFilterSheetOpen((open) => !open)}
        >
          <FunnelIcon />
        </button>
        <PortfolioIndexFilterSheet
          open={filterSheetOpen}
          onClose={closeFilterSheet}
          locale={locale}
          phrases={phrases}
          slides={librarySlides}
          filters={publicFilters}
          onChangeFilter={updatePublicFilter}
          onClearAll={clearPublicFilters}
          videoFormats={videoFormats}
          industries={industries}
          markets={markets}
        />
      </div>
      <PortfolioIndexScrubber
        snapCount={slideCount}
        emblaApi={emblaApi}
      />
    </div>
  );

  if (!slideCount) {
    return (
      <div className="vp-portfolio-index">
        <div className="vp-portfolio-index__stage">
          <p className="py-12 text-center text-vp-text-soft">{t('empty')}</p>
          {filterTrigger}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`vp-portfolio-index${slideCount <= 3 ? ' is-sparse' : ''}`}
    >
      <div className="vp-portfolio-index__stage">
        <p
          className="vp-portfolio-index__counter"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="vp-portfolio-index__counter-current">
            {activeIndex + 1}
          </span>
          <span className="vp-portfolio-index__counter-sep" aria-hidden>
            /
          </span>
          <span className="vp-portfolio-index__counter-total">{slideCount}</span>
        </p>
        <div
          ref={emblaRef}
          className="vp-portfolio-index__viewport"
          aria-label="Portfolio index carousel"
        >
          <div className="vp-portfolio-index__container">
            {filteredSlides.map((slide, index) => {
              const active = index === activeIndex;
              const mountContent = shouldMountPortfolioIndexContent(
                index,
                activeIndex,
                slideCount,
              );
              const mountPoster =
                mountContent &&
                shouldMountPortfolioIndexPoster(index, activeIndex, slideCount);
              const styleCard =
                mountContent &&
                shouldStylePortfolioIndexCard(index, activeIndex, slideCount);
              return (
                <div
                  key={slide.id}
                  className={`vp-portfolio-index__slide${active ? ' is-active' : ''}`}
                >
                  {mountContent ? (
                    <Link
                      href={{
                        pathname: '/portfolio/[slug]',
                        params: {slug: slide.hrefSlug},
                      }}
                      className={`vp-portfolio-index__card${
                        styleCard ? ' vp-portfolio-index__card--styled' : ''
                      }`}
                      tabIndex={active ? undefined : -1}
                      aria-current={active ? 'true' : undefined}
                    >
                      {mountPoster ? (
                        <picture className="vp-portfolio-index__poster-wrap">
                          <source
                            media="(min-width: 576px)"
                            srcSet={slide.posterUrlDesktop}
                          />
                          <img
                            src={slide.posterUrl}
                            alt=""
                            className="vp-portfolio-index__poster"
                            decoding="async"
                            loading={active ? 'eager' : 'lazy'}
                            fetchPriority={active ? 'high' : 'auto'}
                            style={{objectPosition: slide.objectPosition}}
                          />
                        </picture>
                      ) : null}
                      <div className="vp-portfolio-index__overlay">
                        <div
                          className="vp-portfolio-index__overlay-scrim"
                          aria-hidden
                        />
                        <div className="vp-portfolio-index__overlay-copy">
                          {slide.brandLine ? (
                            <p className="vp-portfolio-index__brand">
                              {slide.brandLine}
                            </p>
                          ) : null}
                          {slide.campaignLine ? (
                            <h2 className="vp-portfolio-index__campaign">
                              {slide.campaignLine}
                            </h2>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        {filterTrigger}
      </div>
    </div>
  );
}
