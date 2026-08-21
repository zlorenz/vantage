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
import useEmblaCarousel from 'embla-carousel-react';
import {WheelGestures} from 'wheel-gestures';
import Image from 'next/image';
import {Link} from '@/i18n/navigation';
import type {TaxonomyTerm} from '@/types/sanity';
import type {PortfolioGridEntry} from '@/types/sanity';
import {
  matchesPublicFilters,
  readPublicFilters,
  replacePublicFiltersUrl,
  type PublicFilters,
} from './PortfolioGrid';
import type {PortfolioIndexSlide} from './prepare-portfolio-index-slides';
import './portfolio-index-carousel.css';

interface PortfolioIndexCarouselProps {
  slides: PortfolioIndexSlide[];
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
 * ±8 → up to 17 Images at once (fewer when slideCount is smaller).
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
}: PortfolioIndexCarouselProps) {
  const searchParams = useSearchParams();
  const [publicFilters, setPublicFilters] = useState(() =>
    readPublicFilters(searchParams),
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const gestureAccumRef = useRef(0);
  const gestureFiredRef = useRef(false);
  const filterSignatureRef = useRef<string | null>(null);

  const filteredSlides = useMemo(
    () => slides.filter((slide) => slideMatchesPublicFilters(slide, publicFilters)),
    [slides, publicFilters],
  );
  const slideCount = filteredSlides.length;
  const filterSignature = `${publicFilters.format}|${publicFilters.industry}|${publicFilters.market}`;
  const hasActiveFilters = Boolean(
    publicFilters.format || publicFilters.industry || publicFilters.market,
  );

  // axis: 'x' and align: 'center' are Embla 8.6.0 defaults — omit rather than override.
  // containScroll is a no-op when loop is true (Embla containSnaps = !loop && …).
  const [emblaRef, emblaApi] = useEmblaCarousel({
    dragFree: false,
    loop: true,
  });

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

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  /**
   * When filters change, the rendered slide list length/order changes.
   * Re-init Embla against the new DOM, jump to index 0, and let windowing
   * recompute from activeIndex=0 + filtered slideCount (not the full 146).
   */
  useEffect(() => {
    if (!emblaApi) return;

    const prev = filterSignatureRef.current;
    filterSignatureRef.current = filterSignature;
    if (prev === null || prev === filterSignature) return;

    setActiveIndex(0);
    emblaApi.reInit();
    emblaApi.scrollTo(0, true);
  }, [emblaApi, filterSignature, filteredSlides]);

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
      if (event.repeat) return;
      const {key} = event;
      if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;

      const target = event.target as HTMLElement | null;
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
  }, [emblaApi]);

  const filterTrigger = (
    <div className="vp-portfolio-index__bottom-bar">
      <button
        type="button"
        className={`vp-portfolio-index__filter-trigger${
          hasActiveFilters ? ' is-active' : ''
        }`}
        aria-label="Filter"
        aria-expanded={filterSheetOpen}
        aria-pressed={hasActiveFilters}
        onClick={() => setFilterSheetOpen(true)}
      >
        <FunnelIcon />
      </button>
    </div>
  );

  if (!slideCount) {
    return (
      <div className="vp-portfolio-index">
        <p className="py-12 text-center text-vp-text-soft">
          No portfolio items found.
        </p>
        {filterTrigger}
      </div>
    );
  }

  return (
    <div className="vp-portfolio-index">
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
                      <Image
                        src={slide.posterUrl}
                        alt=""
                        fill
                        sizes="(max-width: 575px) 86vw, (max-width: 991px) 78vw, (max-width: 1399px) 68vw, 62vw"
                        className="vp-portfolio-index__poster"
                        priority={active}
                      />
                    ) : null}
                    <div className="vp-portfolio-index__overlay" aria-hidden />
                    <h2
                      className="vp-portfolio-index__title"
                      dangerouslySetInnerHTML={{__html: slide.titleHtml}}
                    />
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      {filterTrigger}
    </div>
  );
}
