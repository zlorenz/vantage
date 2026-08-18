'use client';

/**
 * Full-viewport featured-work carousel (vertical only), in document flow.
 * Touch: native CSS scroll-snap. Wheel / keys: one animated page at a time.
 * No wrap. No timer-based auto-advance. At the first/last slide, further
 * scroll chains into the page (content below / back to the top).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CarouselSlide } from './CarouselSlide';
import {
  boundaryLatchDirection,
  isBoundaryRelease,
  isCarouselScrollActive,
  shouldKeepBoundaryLatch,
  shouldReleaseKeyToPage,
  shouldReleaseWheelToPage,
  type BoundaryLatchDirection,
} from './scroll-chain';
import {
  getScrollTransitionState,
  syncOverlapToSlides,
  type OverlapPair,
} from './transition';
import { shouldMountCarouselPlayer, type PrototypeCarouselSlide } from './types';
import './carousel.css';

interface FeaturedWorkCarouselProps {
  slides: PrototypeCarouselSlide[];
}

const SLIDE_DURATION_MS = 300;
const WHEEL_THRESHOLD_PX = 30;
const WHEEL_GESTURE_END_MS = 140;
const TOUCH_BOUNDARY_PX = 10;

type AnimSignal = { cancelled: boolean };

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function normalizeWheelDelta(event: WheelEvent): number {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function animateScrollTop(
  scroller: HTMLElement,
  to: number,
  duration: number,
  signal: AnimSignal,
  onFrame?: (scrollTop: number) => void,
): Promise<void> {
  const from = scroller.scrollTop;
  const delta = to - from;
  if (Math.abs(delta) < 1 || duration <= 0) {
    scroller.scrollTop = to;
    onFrame?.(to);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      if (signal.cancelled) {
        resolve();
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const nextTop = from + delta * easeOutCubic(t);
      scroller.scrollTop = nextTop;
      onFrame?.(nextTop);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        scroller.scrollTop = to;
        onFrame?.(to);
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

export function FeaturedWorkCarousel({ slides }: FeaturedWorkCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const activeIndexRef = useRef(0);
  const animatingRef = useRef(false);
  const animSignalRef = useRef<AnimSignal | null>(null);
  const wheelLockedRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelIdleTimerRef = useRef(0);
  const settledIndexRef = useRef(0);
  const overlapPairRef = useRef<OverlapPair | null>(null);
  const carouselActiveRef = useRef(true);
  const boundaryLatchRef = useRef<BoundaryLatchDirection | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [neighborMountIndex, setNeighborMountIndex] = useState(0);

  const lastIndex = Math.max(0, slides.length - 1);

  const commitActiveIndex = useCallback((index: number) => {
    if (index === activeIndexRef.current) return false;
    activeIndexRef.current = index;
    setActiveIndex(index);
    return true;
  }, []);

  const setCarouselScrollActive = useCallback((active: boolean) => {
    if (active === carouselActiveRef.current) return;
    carouselActiveRef.current = active;
    rootRef.current?.classList.toggle('is-scroll-passive', !active);
  }, []);

  useLayoutEffect(() => {
    rootRef.current?.classList.toggle(
      'is-scroll-passive',
      !carouselActiveRef.current,
    );
  });

  const readVisibilityActive = useCallback(() => {
    const root = rootRef.current;
    if (!root) return false;
    const rect = root.getBoundingClientRect();
    // visualViewport height for the on-screen gate — not carousel box sizing.
    // innerHeight can disagree with the visual viewport (DevTools device mode,
    // iOS chrome) and drop the ratio below 0.85 while the carousel still fills
    // the screen.
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    return isCarouselScrollActive({
      rootTop: rect.top,
      intersectionRatio:
        rect.height > 0
          ? Math.max(0, Math.min(viewportHeight, rect.bottom) - Math.max(0, rect.top)) /
            rect.height
          : 0,
    });
  }, []);

  const applyScrollActive = useCallback((visibilityActive: boolean) => {
    // Re-validate on every visibility pass (window scroll/resize/IO), not
    // only on scroller wheel/touch — those never fire while is-scroll-passive
    // sets pointer-events: none. Keep the latch only while still on the
    // edge that armed it; a mid-sequence latch must drop even if the
    // carousel is still in the visibility band.
    if (!visibilityActive) {
      boundaryLatchRef.current = null;
    } else if (
      boundaryLatchRef.current &&
      !shouldKeepBoundaryLatch({
        direction: boundaryLatchRef.current,
        activeIndex: activeIndexRef.current,
        lastIndex,
      })
    ) {
      boundaryLatchRef.current = null;
    }
    setCarouselScrollActive(visibilityActive && boundaryLatchRef.current == null);
  }, [lastIndex, setCarouselScrollActive]);

  const releasePastBoundary = useCallback(
    (deltaY: number) => {
      if (!carouselActiveRef.current) return false;
      if (
        !isBoundaryRelease({
          activeIndex: activeIndexRef.current,
          lastIndex,
          deltaY,
        })
      ) {
        return false;
      }
      const direction = boundaryLatchDirection(deltaY);
      if (!direction) return false;
      boundaryLatchRef.current = direction;
      setCarouselScrollActive(false);
      return true;
    },
    [lastIndex, setCarouselScrollActive],
  );

  const restoreFromBoundaryIfReversed = useCallback(
    (deltaY: number) => {
      if (boundaryLatchRef.current == null) return;
      if (
        isBoundaryRelease({
          activeIndex: activeIndexRef.current,
          lastIndex,
          deltaY,
        })
      ) {
        return;
      }
      boundaryLatchRef.current = null;
      applyScrollActive(readVisibilityActive());
    },
    [applyScrollActive, lastIndex, readVisibilityActive],
  );

  const syncOverlap = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    if (prefersReducedMotion()) {
      overlapPairRef.current = syncOverlapToSlides(
        slideRefs.current,
        {settled: true, index: settledIndexRef.current},
        overlapPairRef.current,
      );
      return;
    }

    const state = getScrollTransitionState(
      scroller.scrollTop,
      scroller.clientHeight,
      settledIndexRef.current,
      lastIndex,
    );
    if (state.settled) settledIndexRef.current = state.index;
    overlapPairRef.current = syncOverlapToSlides(
      slideRefs.current,
      state,
      overlapPairRef.current,
    );
  }, [lastIndex]);

  useEffect(() => {
    void import('@vimeo/player');
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const syncCarouselScrollActive = () => {
      applyScrollActive(readVisibilityActive());
    };

    const observer = new IntersectionObserver(
      () => {
        syncCarouselScrollActive();
      },
      {threshold: [0, 0.25, 0.5, 0.75, 0.85, 0.9, 1]},
    );

    observer.observe(root);
    window.addEventListener('scroll', syncCarouselScrollActive, {passive: true});
    window.addEventListener('resize', syncCarouselScrollActive, {passive: true});
    syncCarouselScrollActive();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', syncCarouselScrollActive);
      window.removeEventListener('resize', syncCarouselScrollActive);
    };
  }, [applyScrollActive, readVisibilityActive, slides.length]);

  useEffect(() => {
    applyScrollActive(readVisibilityActive());
  }, [activeIndex, applyScrollActive, readVisibilityActive]);

  useEffect(() => {
    if (neighborMountIndex === activeIndex) return;
    const id = window.setTimeout(() => {
      setNeighborMountIndex(activeIndex);
    }, SLIDE_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [activeIndex, neighborMountIndex]);

  const goTo = useCallback(
    (index: number, animate: boolean) => {
      const scroller = scrollerRef.current;
      const next = Math.min(Math.max(index, 0), lastIndex);
      if (!commitActiveIndex(next)) return;

      if (!scroller) return;
      const top = next * scroller.clientHeight;

      if (animSignalRef.current) animSignalRef.current.cancelled = true;
      const signal: AnimSignal = { cancelled: false };
      animSignalRef.current = signal;

      if (!animate || prefersReducedMotion()) {
        scroller.classList.remove('is-paging');
        scroller.scrollTop = top;
        animatingRef.current = false;
        syncOverlap();
        return;
      }

      animatingRef.current = true;
      scroller.classList.add('is-paging');
      void scroller.offsetHeight;

      void animateScrollTop(scroller, top, SLIDE_DURATION_MS, signal, syncOverlap).then(() => {
        if (signal.cancelled) return;
        scroller.scrollTop = top;
        scroller.classList.remove('is-paging');
        animatingRef.current = false;
        syncOverlap();
      });
    },
    [commitActiveIndex, lastIndex, syncOverlap],
  );

  useEffect(() => {
    return () => {
      if (animSignalRef.current) animSignalRef.current.cancelled = true;
      window.clearTimeout(wheelIdleTimerRef.current);
      overlapPairRef.current = syncOverlapToSlides(
        slideRefs.current,
        {settled: true, index: settledIndexRef.current},
        overlapPairRef.current,
      );
    };
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (animatingRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.index);
        if (!Number.isFinite(index)) return;
        commitActiveIndex(index);
      },
      { root: scroller, threshold: [0.6, 0.9] },
    );

    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide);
    }

    return () => observer.disconnect();
  }, [commitActiveIndex, slides.length]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.addEventListener('scroll', syncOverlap, {passive: true});
    scroller.addEventListener('scrollend', syncOverlap);
    return () => {
      scroller.removeEventListener('scroll', syncOverlap);
      scroller.removeEventListener('scrollend', syncOverlap);
    };
  }, [syncOverlap]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const scheduleWheelUnlock = () => {
      window.clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = window.setTimeout(() => {
        if (animatingRef.current) {
          scheduleWheelUnlock();
          return;
        }
        wheelLockedRef.current = false;
        wheelAccumRef.current = 0;
      }, WHEEL_GESTURE_END_MS);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;

      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const delta = normalizeWheelDelta(event);
      if (delta === 0) return;

      if (animatingRef.current) {
        event.preventDefault();
        scheduleWheelUnlock();
        return;
      }

      if (
        shouldReleaseWheelToPage({
          carouselActive: carouselActiveRef.current,
          activeIndex: activeIndexRef.current,
          lastIndex,
          deltaY: delta,
        })
      ) {
        if (!releasePastBoundary(delta)) restoreFromBoundaryIfReversed(delta);
        return;
      }

      event.preventDefault();

      if (wheelLockedRef.current) {
        scheduleWheelUnlock();
        return;
      }

      wheelAccumRef.current += delta;
      if (Math.abs(wheelAccumRef.current) < WHEEL_THRESHOLD_PX) {
        scheduleWheelUnlock();
        return;
      }

      const dir = wheelAccumRef.current > 0 ? 1 : -1;
      wheelAccumRef.current = 0;
      wheelLockedRef.current = true;
      goTo(activeIndexRef.current + dir, true);
      scheduleWheelUnlock();
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      scroller.removeEventListener('wheel', onWheel);
      window.clearTimeout(wheelIdleTimerRef.current);
    };
  }, [goTo, lastIndex, releasePastBoundary, restoreFromBoundaryIfReversed]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || animatingRef.current) return;

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

      if (
        shouldReleaseKeyToPage({
          carouselActive: carouselActiveRef.current,
          activeIndex: activeIndexRef.current,
          lastIndex,
          key,
        })
      ) {
        const deltaY =
          key === 'ArrowDown' || key === 'PageDown' || key === 'End' ? 1 : -1;
        if (!releasePastBoundary(deltaY)) restoreFromBoundaryIfReversed(deltaY);
        return;
      }

      event.preventDefault();
      if (key === 'ArrowDown' || key === 'PageDown') {
        goTo(activeIndexRef.current + 1, true);
      } else if (key === 'ArrowUp' || key === 'PageUp') {
        goTo(activeIndexRef.current - 1, true);
      } else if (key === 'Home') {
        goTo(0, true);
      } else {
        goTo(lastIndex, true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goTo, lastIndex, releasePastBoundary, restoreFromBoundaryIfReversed]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY == null || currentY == null) return;
      const deltaY = startY - currentY;
      if (Math.abs(deltaY) < TOUCH_BOUNDARY_PX) return;
      if (releasePastBoundary(deltaY)) return;
      restoreFromBoundaryIfReversed(deltaY);
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };

    scroller.addEventListener('touchstart', onTouchStart, {passive: true});
    scroller.addEventListener('touchmove', onTouchMove, {passive: true});
    scroller.addEventListener('touchend', onTouchEnd, {passive: true});
    scroller.addEventListener('touchcancel', onTouchEnd, {passive: true});
    return () => {
      scroller.removeEventListener('touchstart', onTouchStart);
      scroller.removeEventListener('touchmove', onTouchMove);
      scroller.removeEventListener('touchend', onTouchEnd);
      scroller.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [releasePastBoundary, restoreFromBoundaryIfReversed]);

  if (!slides.length) {
    return (
      <div className="vp-proto-carousel">
        <p className="vp-proto-carousel__overlay">No featured work slides resolved.</p>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="vp-proto-carousel"
    >
      <div
        ref={scrollerRef}
        className="vp-proto-carousel__scroller"
        aria-label="Featured work carousel"
      >
        {slides.map((slide, index) => (
          <CarouselSlide
            key={slide.slug}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            slide={slide}
            index={index}
            active={index === activeIndex}
            mountPlayer={shouldMountCarouselPlayer(index, activeIndex, neighborMountIndex)}
          />
        ))}
      </div>
    </div>
  );
}
