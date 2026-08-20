'use client';

/**
 * Featured-work carousel — one Embla engine for all pointer types.
 *
 * Embla moves the slide strip with a transform on its container (`loop: true`).
 * Wheel/trackpad paging uses `wheel-gestures` (`isStart` / `isMomentum`) plus an
 * in-gesture |deltaY| threshold. Keyboard nav (arrows, Page, Home, End) calls
 * Embla's scroll API directly. There is no nested scroll container and no
 * clone/teleport wrap.
 */

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type {EmblaOptionsType} from 'embla-carousel';
import {WheelGestures} from 'wheel-gestures';
import {CarouselSlide} from './CarouselSlide';
import {isCarouselScrollActive} from './scroll-chain';
import {
  getScrollTransitionState,
  syncOverlapToSlides,
  type OverlapPair,
  type ScrollTransitionState,
} from './transition';
import {
  shouldMountCarouselPlayer,
  wrapSlideIndex,
  type PrototypeCarouselSlide,
} from './types';
// TEMP-DIAGNOSTIC — remove after investigation
import {
  HLS_NEIGHBOR_PROBE_MODE,
  probeNeighborMountDelayMs,
} from './hls-neighbor-probe';
import './carousel.css';

interface FeaturedWorkCarouselProps {
  slides: PrototypeCarouselSlide[];
}

/** Hold before a newly entered neighbor mounts.
 * TEMP-DIAGNOSTIC — probeNeighborMountDelayMs() overrides for early-mount modes. */
const NEIGHBOR_MOUNT_DELAY_MS = probeNeighborMountDelayMs();
/** In-gesture |deltaY| before paging; gesture bounds come from wheel-gestures. */
const WHEEL_GESTURE_THRESHOLD_PX = 30;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Representative of `index` in the same loop lap as `position`.
 *
 * Embla's location is cyclic, so a settled index of 0 sits at position 0 going
 * forward but at position `count` coming backward over the wrap. Picking the
 * nearer representative is what lets transition.ts infer travel direction
 * across the wrap instead of reading it as a full-strip jump.
 */
function nearestLapIndex(index: number, position: number, count: number): number {
  return [index, index - count, index + count].reduce((best, candidate) =>
    Math.abs(position - candidate) < Math.abs(position - best) ? candidate : best,
  );
}

/** Bring transition state indices back into [0, count) after the +1 lap span. */
function wrapTransitionState(
  state: ScrollTransitionState,
  count: number,
): ScrollTransitionState {
  if (state.settled) return state;
  return {
    ...state,
    outgoingIndex: wrapSlideIndex(state.outgoingIndex, count),
    incomingIndex: wrapSlideIndex(state.incomingIndex, count),
  };
}

export function FeaturedWorkCarousel({slides}: FeaturedWorkCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const overlapPairRef = useRef<OverlapPair | null>(null);
  const settledIndexRef = useRef(0);
  const carouselActiveRef = useRef(true);
  const gestureAccumRef = useRef(0);
  const gestureFiredRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [neighborMountIndex, setNeighborMountIndex] = useState(0);

  const slideCount = slides.length;

  const emblaOptions = useMemo<EmblaOptionsType>(
    () => ({
      axis: 'y',
      loop: true,
      align: 'start',
      // Discrete paging — never free-scrolling.
      dragFree: false,
      // Hand the gesture back to the page whenever the carousel is not the
      // primary viewport occupant, mirroring the is-scroll-passive gate.
      watchDrag: () => carouselActiveRef.current,
    }),
    [],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);

  const setCarouselScrollActive = useCallback((active: boolean) => {
    if (active === carouselActiveRef.current) return;
    carouselActiveRef.current = active;
    rootRef.current?.classList.toggle('is-scroll-passive', !active);
  }, []);

  const readVisibilityActive = useCallback(() => {
    const root = rootRef.current;
    if (!root) return false;
    const rect = root.getBoundingClientRect();
    // visualViewport height for the on-screen gate — innerHeight can disagree
    // with the visual viewport and drop the ratio below the threshold while the
    // carousel still fills the screen.
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const intersectionRatio =
      rect.height > 0
        ? Math.max(0, Math.min(viewportHeight, rect.bottom) - Math.max(0, rect.top)) /
          rect.height
        : 0;
    return isCarouselScrollActive({rootTop: rect.top, intersectionRatio});
  }, []);

  const syncOverlap = useCallback(() => {
    if (!emblaApi || slideCount < 2) return;

    if (prefersReducedMotion()) {
      overlapPairRef.current = syncOverlapToSlides(
        slideRefs.current,
        {settled: true, index: settledIndexRef.current},
        overlapPairRef.current,
      );
      return;
    }

    const engine = emblaApi.internalEngine();
    const {scrollSnaps} = engine;
    // Uniform because every slide is a full-height flex item.
    const stride = Math.abs(scrollSnaps[0] - scrollSnaps[1]);
    if (!Number.isFinite(stride) || stride <= 0) return;

    // Express the cyclic pixel location as a slide-index position, then give
    // transition.ts a span one slide longer than the real list so the wrap
    // segment (last -> first) is an ordinary adjacent pair rather than a
    // clamped edge. Index `slideCount` is slide 0 on the next lap.
    const position = (scrollSnaps[0] - engine.offsetLocation.get()) / stride;
    const settledInLap = nearestLapIndex(settledIndexRef.current, position, slideCount);

    const state = getScrollTransitionState(
      position * stride,
      stride,
      settledInLap,
      slideCount,
    );

    if (state.settled) {
      settledIndexRef.current = wrapSlideIndex(state.index, slideCount);
    }

    overlapPairRef.current = syncOverlapToSlides(
      slideRefs.current,
      wrapTransitionState(state, slideCount),
      overlapPairRef.current,
    );
  }, [emblaApi, slideCount]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const syncCarouselScrollActive = () => {
      setCarouselScrollActive(readVisibilityActive());
    };

    const observer = new IntersectionObserver(syncCarouselScrollActive, {
      threshold: [0, 0.25, 0.5, 0.75, 0.85, 0.9, 1],
    });

    observer.observe(root);
    window.addEventListener('scroll', syncCarouselScrollActive, {passive: true});
    window.addEventListener('resize', syncCarouselScrollActive, {passive: true});
    syncCarouselScrollActive();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', syncCarouselScrollActive);
      window.removeEventListener('resize', syncCarouselScrollActive);
    };
  }, [readVisibilityActive, setCarouselScrollActive, slideCount]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());

    // `scroll` fires once per animation frame while unsettled — during the drag
    // itself, not only on release — which is what keeps the overlap continuous.
    emblaApi.on('scroll', syncOverlap);
    emblaApi.on('settle', syncOverlap);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('reInit', syncOverlap);
    onSelect();
    syncOverlap();

    return () => {
      emblaApi.off('scroll', syncOverlap);
      emblaApi.off('settle', syncOverlap);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('reInit', syncOverlap);
    };
  }, [emblaApi, syncOverlap]);

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
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;
      if (deltaY === 0) return;
      if (!carouselActiveRef.current) return;

      event.preventDefault?.();

      if (isMomentum) return;

      gestureAccumRef.current += Math.abs(deltaY);
      if (gestureFiredRef.current) return;
      if (gestureAccumRef.current < WHEEL_GESTURE_THRESHOLD_PX) return;

      gestureFiredRef.current = true;
      if (deltaY > 0) {
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
      if (
        key !== 'ArrowDown' &&
        key !== 'PageDown' &&
        key !== 'ArrowUp' &&
        key !== 'PageUp' &&
        key !== 'Home' &&
        key !== 'End'
      ) {
        return;
      }

      if (!carouselActiveRef.current) return;

      event.preventDefault();
      if (key === 'ArrowDown' || key === 'PageDown') {
        emblaApi.scrollNext();
      } else if (key === 'ArrowUp' || key === 'PageUp') {
        emblaApi.scrollPrev();
      } else if (key === 'Home') {
        emblaApi.scrollTo(0);
      } else {
        emblaApi.scrollTo(Math.max(0, slideCount - 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [emblaApi, slideCount]);

  useEffect(() => {
    // TEMP-DIAGNOSTIC — remove after investigation
    console.log(
      `[hls-probe] mode=${HLS_NEIGHBOR_PROBE_MODE} neighborDelayMs=${NEIGHBOR_MOUNT_DELAY_MS} activeIndex=${activeIndex} neighborMountIndex=${neighborMountIndex}`,
    );
    if (neighborMountIndex === activeIndex) return;
    const id = window.setTimeout(() => {
      setNeighborMountIndex(activeIndex);
    }, NEIGHBOR_MOUNT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [activeIndex, neighborMountIndex]);

  if (!slideCount) {
    return (
      <div className="vp-proto-carousel">
        <p className="vp-proto-carousel__overlay">No featured work slides resolved.</p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="vp-proto-carousel">
      <div
        ref={emblaRef}
        className="vp-proto-carousel__viewport"
        aria-label="Featured work carousel"
      >
        <div className="vp-proto-carousel__container">
          {slides.map((slide, index) => (
            <CarouselSlide
              key={slide.slug}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              slide={slide}
              index={index}
              active={index === activeIndex}
              mountPlayer={shouldMountCarouselPlayer(
                index,
                activeIndex,
                neighborMountIndex,
                slideCount,
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
