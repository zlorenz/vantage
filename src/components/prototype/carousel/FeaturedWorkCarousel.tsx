'use client';

/**
 * Full-viewport featured-work prototype (vertical only).
 * Touch: native CSS scroll-snap. Wheel / keys: one animated page at a time.
 * Hard-stop at the ends. No wrap. No timer-based auto-advance.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CarouselSlide } from './CarouselSlide';
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [neighborMountIndex, setNeighborMountIndex] = useState(0);

  const lastIndex = Math.max(0, slides.length - 1);

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
      if (next === activeIndexRef.current) return;

      activeIndexRef.current = next;
      setActiveIndex(next);

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
    [lastIndex, syncOverlap],
  );

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overscrollBehavior = prev.bodyOverscroll;
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
        if (!Number.isFinite(index) || index === activeIndexRef.current) return;
        activeIndexRef.current = index;
        setActiveIndex(index);
      },
      { root: scroller, threshold: [0.6, 0.9] },
    );

    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide);
    }

    return () => observer.disconnect();
  }, [slides.length]);

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

      event.preventDefault();

      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      if (wheelLockedRef.current || animatingRef.current) {
        scheduleWheelUnlock();
        return;
      }

      const delta = normalizeWheelDelta(event);
      if (delta === 0) return;

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
  }, [goTo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || animatingRef.current) return;

      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault();
        goTo(activeIndexRef.current + 1, true);
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        goTo(activeIndexRef.current - 1, true);
      } else if (event.key === 'Home') {
        event.preventDefault();
        goTo(0, true);
      } else if (event.key === 'End') {
        event.preventDefault();
        goTo(lastIndex, true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goTo, lastIndex]);

  if (!slides.length) {
    return (
      <div className="vp-proto-carousel">
        <p className="vp-proto-carousel__overlay">No prototype slides resolved.</p>
      </div>
    );
  }

  return (
    <div className="vp-proto-carousel">
      <div className="vp-proto-carousel__chrome">
        <span className="vp-proto-carousel__badge">Prototype</span>
        <span className="vp-proto-carousel__count">
          {activeIndex + 1} / {slides.length}
        </span>
      </div>

      <div
        ref={scrollerRef}
        className="vp-proto-carousel__scroller"
        aria-label="Featured work prototype carousel"
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
