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
import type {TaxonomyTerm} from '@/types/sanity';
import {
  readPublicFilters,
  replacePublicFiltersUrl,
  type PublicFilters,
} from './PortfolioGrid';
import {PortfolioIndexFilterSheet} from './PortfolioIndexFilterSheet';
import {PortfolioIndexScrubber} from './PortfolioIndexScrubber';
import type {PortfolioIndexSlide} from './prepare-portfolio-index-slides';
import {nearestSnapIndexFromProgress} from './nearest-snap-from-progress';
import {
  filterPortfolioIndexSlides,
  readWorkIndexItem,
  readWorkIndexSearch,
  resolveWorkIndexStartIndex,
  workIndexItemQuery,
  workIndexSearchQuery,
} from './work-index-url';
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
 * How far from the active snap a decoded <picture>/<img> may remain in the DOM.
 * Outside this radius the poster unmounts (memory bound). Inside it, the node
 * stays mounted even when the slide leaves the ±2 content window — hidden via
 * `.vp-portfolio-index__card--kept-inert` so scrubbing back does not rebuild
 * the <img> (blank-tile / re-fetch bug). ±30 ≈ up to 61 posters; ~150–300MB
 * decoded worst case depending on mobile vs desktop bake.
 */
const POSTER_KEEP_ALIVE_RADIUS = 30;

/**
 * Neighbors of the active snap that get loading="eager" when their poster
 * first mounts inside the keep-alive ring. Farther keep-alive posters use
 * lazy until they near the viewport; once decoded they stay via keep-alive.
 */
const EAGER_LOAD_RADIUS = 3;

/**
 * How many neighbors get radius/overflow/transform/transition styling.
 * Peek layout shows ~3 cards; ±2 → 5 styled cards (active + peeks + buffer).
 */
const STYLE_WINDOW_RADIUS = 2;

/**
 * How many neighbors mount interactive chrome: hit-target Link, overlay copy,
 * and (with STYLE_WINDOW_RADIUS) --styled classes. Far keep-alive slides keep
 * only a hidden poster shell — no Link/title — so Embla shells stay inert.
 */
const CONTENT_WINDOW_RADIUS = 2;

/**
 * Loop needs enough slides to build clones. Sparse filtered sets (1–3) stay
 * non-looping. Embla’s default containScroll: 'trimSnaps' then pins the first
 * snap to the start — a single card sits left instead of the active center.
 */
function portfolioIndexEmblaOptions(slideCount: number, startIndex = 0) {
  const loop = slideCount > 3;
  return {
    dragFree: false as const,
    loop,
    align: 'center' as const,
    containScroll: loop ? ('trimSnaps' as const) : (false as const),
    startIndex,
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

/** True when the poster <picture> should exist in the DOM (may be CSS-hidden). */
function shouldKeepAlivePortfolioIndexPoster(
  index: number,
  activeIndex: number,
  slideCount: number,
  radius: number = POSTER_KEEP_ALIVE_RADIUS,
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

function SearchIcon() {
  return (
    <svg
      className="vp-portfolio-index__filter-trigger-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M10.5 3.75a6.75 6.75 0 1 0 4.248 12.032l3.735 3.735a.75.75 0 1 0 1.06-1.06l-3.734-3.735A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
      />
    </svg>
  );
}

function ClearBadgeIcon() {
  return (
    <svg
      className="vp-portfolio-index__clear-badge-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M6.22 6.22a.75.75 0 0 1 1.06 0L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 12 6.22 7.28a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

function SearchSubmitIcon() {
  return (
    <svg
      className="vp-portfolio-index__search-submit-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M13.28 5.22a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06L18.44 12.75H3.75a.75.75 0 0 1 0-1.5h14.69l-5.16-5.03a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
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
  const tSearch = useTranslations('Search');
  const searchParams = useSearchParams();
  const [publicFilters, setPublicFilters] = useState(() =>
    readPublicFilters(searchParams),
  );
  const [committedSearch, setCommittedSearch] = useState(() =>
    readWorkIndexSearch(searchParams),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [draftSearch, setDraftSearch] = useState('');
  const [searchNoResultsQuery, setSearchNoResultsQuery] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(() =>
    resolveWorkIndexStartIndex(
      slides,
      readPublicFilters(searchParams),
      readWorkIndexItem(searchParams),
      readWorkIndexSearch(searchParams),
    ),
  );
  const restoredStartIndexRef = useRef(activeIndex);
  const gestureAccumRef = useRef(0);
  const gestureFiredRef = useRef(false);
  const filterSignatureRef = useRef<string | null>(null);

  const hasActiveFilters = Boolean(
    publicFilters.format || publicFilters.industry || publicFilters.market,
  );
  const hasActiveSearch = Boolean(committedSearch.trim());
  const filteredSlides = useMemo(
    () => filterPortfolioIndexSlides(slides, publicFilters, committedSearch),
    [slides, publicFilters, committedSearch],
  );
  const librarySlides = useMemo(
    () => slides.filter((slide) => !slide.isAppendedFeatured),
    [slides],
  );
  const slideCount = filteredSlides.length;
  const filterSignature = `${publicFilters.format}|${publicFilters.industry}|${publicFilters.market}|${committedSearch.trim().toLowerCase()}`;

  const emblaOptionsRef = useRef(
    portfolioIndexEmblaOptions(slideCount, restoredStartIndexRef.current),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptionsRef.current);

  const activeItemSlugForUrl =
    activeIndex > 0 ? (filteredSlides[activeIndex]?.hrefSlug ?? '') : '';

  const writeWorkIndexUrl = useCallback(
    (
      filters: PublicFilters,
      search: string,
      itemSlug: string,
      index: number,
    ) => {
      replacePublicFiltersUrl(filters, EMPTY_PUBLIC_PRESETS, {
        ...workIndexSearchQuery(search),
        ...workIndexItemQuery(itemSlug, index),
      });
    },
    [],
  );

  useEffect(() => {
    writeWorkIndexUrl(
      publicFilters,
      committedSearch,
      activeItemSlugForUrl,
      activeIndex,
    );
  }, [
    publicFilters,
    committedSearch,
    activeItemSlugForUrl,
    activeIndex,
    writeWorkIndexUrl,
  ]);

  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      setPublicFilters(readPublicFilters(params));
      setCommittedSearch(readWorkIndexSearch(params));
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSearchOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]);
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
    const restored = restoredStartIndexRef.current;
    if (restored > 0) {
      emblaApi.scrollTo(restored, true);
      setActiveIndex(restored);
    } else {
      onSelect();
    }
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
      if (filterSheetOpen || searchOpen) return;
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
  }, [emblaApi, filterSheetOpen, searchOpen]);

  const openSearch = useCallback(() => {
    setFilterSheetOpen(false);
    setDraftSearch(committedSearch);
    setSearchNoResultsQuery('');
    setSearchOpen(true);
  }, [committedSearch]);

  const closeSearch = useCallback(() => {
    setSearchNoResultsQuery('');
    setSearchOpen(false);
  }, []);

  const submitSearch = useCallback(() => {
    const next = draftSearch.trim();

    // Empty submit clears any committed search and closes the overlay.
    if (!next) {
      setCommittedSearch('');
      setSearchNoResultsQuery('');
      setActiveIndex(0);
      setSearchOpen(false);
      return;
    }

    // Preview against the full library (search clears taxonomy filters on commit).
    const matches = filterPortfolioIndexSlides(
      slides,
      EMPTY_PUBLIC_PRESETS,
      next,
    );
    if (matches.length === 0) {
      setSearchNoResultsQuery(next);
      // Keep overlay + draft; leave carousel / committed search untouched.
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      });
      return;
    }

    setSearchNoResultsQuery('');
    setCommittedSearch(next);
    setPublicFilters(EMPTY_PUBLIC_PRESETS);
    setActiveIndex(0);
    setSearchOpen(false);
  }, [draftSearch, slides]);

  const clearSearch = useCallback(() => {
    setCommittedSearch('');
    setDraftSearch('');
    setSearchNoResultsQuery('');
    setActiveIndex(0);
    setSearchOpen(false);
  }, []);

  const updatePublicFilter = useCallback(
    (key: keyof PublicFilters, value: string) => {
      setPublicFilters((prev) => ({...prev, [key]: value}));
      // Activating a filter clears any committed search.
      setCommittedSearch('');
      setDraftSearch('');
      setActiveIndex(0);
    },
    [],
  );

  const clearPublicFilters = useCallback(() => {
    setPublicFilters(EMPTY_PUBLIC_PRESETS);
    setActiveIndex(0);
  }, []);

  const closeFilterSheet = useCallback(() => {
    setFilterSheetOpen(false);
  }, []);

  const filterTrigger = (
    <div className="vp-portfolio-index__bottom-bar">
      <div className="vp-portfolio-index__tool vp-portfolio-index__tool--filter">
        <div className="vp-portfolio-index__filter-anchor">
          <button
            type="button"
            className={`vp-portfolio-index__filter-trigger${
              hasActiveFilters ? ' is-active' : ''
            }`}
            aria-label={t('filter')}
            aria-expanded={filterSheetOpen}
            aria-pressed={hasActiveFilters}
            onClick={() => {
              setSearchOpen(false);
              setFilterSheetOpen((open) => !open);
            }}
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
        {hasActiveFilters ? (
          <button
            type="button"
            className="vp-portfolio-index__clear-badge vp-portfolio-index__clear-badge--filter"
            aria-label={t('clearFiltersAria')}
            onClick={clearPublicFilters}
          >
            <ClearBadgeIcon />
          </button>
        ) : null}
      </div>
      <PortfolioIndexScrubber
        snapCount={slideCount}
        emblaApi={emblaApi}
      />
      <div className="vp-portfolio-index__tool vp-portfolio-index__tool--search">
        <button
          type="button"
          className={`vp-portfolio-index__filter-trigger${
            hasActiveSearch ? ' is-active' : ''
          }`}
          aria-label={tSearch('openAria')}
          aria-expanded={searchOpen}
          aria-pressed={hasActiveSearch}
          onClick={openSearch}
        >
          <SearchIcon />
        </button>
        {hasActiveSearch ? (
          <button
            type="button"
            className="vp-portfolio-index__clear-badge vp-portfolio-index__clear-badge--search"
            aria-label={t('clearSearchAria')}
            onClick={clearSearch}
          >
            <ClearBadgeIcon />
          </button>
        ) : null}
      </div>
    </div>
  );

  const searchOverlay = searchOpen ? (
    <div className="vp-portfolio-index__search-overlay" role="presentation">
      <button
        type="button"
        className="vp-portfolio-index__search-scrim"
        aria-label={tSearch('closeAria')}
        tabIndex={-1}
        onClick={closeSearch}
      />
      <div className="vp-portfolio-index__search-stack">
        {searchNoResultsQuery ? (
          <p
            className="vp-portfolio-index__search-no-results"
            role="status"
            aria-live="polite"
          >
            {tSearch('noResults', {query: searchNoResultsQuery})}
          </p>
        ) : null}
        <form
          className="vp-portfolio-index__search-field"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <input
            ref={searchInputRef}
            type="search"
            className="vp-portfolio-index__search-input"
            value={draftSearch}
            onChange={(event) => {
              setDraftSearch(event.target.value);
              if (searchNoResultsQuery) setSearchNoResultsQuery('');
            }}
            placeholder={tSearch('placeholder')}
            aria-label={tSearch('placeholder')}
            autoComplete="off"
            enterKeyHint="search"
          />
          <button
            type="submit"
            className="vp-portfolio-index__search-submit"
            aria-label={tSearch('submitAria')}
          >
            <SearchSubmitIcon />
          </button>
        </form>
      </div>
    </div>
  ) : null;

  if (!slideCount) {
    return (
      <div className="vp-portfolio-index">
        <div className="vp-portfolio-index__stage">
          <p className="py-12 text-center text-vp-text-soft">{t('empty')}</p>
          {filterTrigger}
        </div>
        {searchOverlay}
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
              // Poster DOM lifetime is independent of mountContent (±2). Nested
              // under content previously destroyed <img> on every scrub exit.
              const keepAlivePoster = shouldKeepAlivePortfolioIndexPoster(
                index,
                activeIndex,
                slideCount,
              );
              const eagerPoster =
                keepAlivePoster &&
                isWithinCircularWindow(
                  index,
                  activeIndex,
                  slideCount,
                  EAGER_LOAD_RADIUS,
                );
              const styleCard =
                mountContent &&
                shouldStylePortfolioIndexCard(index, activeIndex, slideCount);
              const cardClassName = [
                'vp-portfolio-index__card',
                styleCard ? 'vp-portfolio-index__card--styled' : '',
                // Keep-alive outside ±2: hide the shell (same visual as empty
                // Embla track) without unmounting the decoded <img>.
                keepAlivePoster && !mountContent
                  ? 'vp-portfolio-index__card--kept-inert'
                  : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <div
                  key={slide.id}
                  className={`vp-portfolio-index__slide${active ? ' is-active' : ''}`}
                >
                  {keepAlivePoster ? (
                    <div className={cardClassName}>
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
                          loading={eagerPoster ? 'eager' : 'lazy'}
                          fetchPriority={active ? 'high' : 'auto'}
                          style={{objectPosition: slide.objectPosition}}
                        />
                      </picture>
                      {mountContent ? (
                        <Link
                          href={{
                            pathname: '/portfolio/[slug]',
                            params: {slug: slide.hrefSlug},
                          }}
                          className="vp-portfolio-index__card-link"
                          tabIndex={active ? undefined : -1}
                          aria-current={active ? 'true' : undefined}
                          onClick={() => {
                            writeWorkIndexUrl(
                              publicFilters,
                              committedSearch,
                              slide.hrefSlug,
                              index,
                            );
                          }}
                        >
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
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        {filterTrigger}
      </div>
      {searchOverlay}
    </div>
  );
}
