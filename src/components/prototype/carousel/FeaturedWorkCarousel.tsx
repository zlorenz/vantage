'use client';

/**
 * Full-viewport featured-work prototype.
 * Hard-stop at the ends. Swipe / page keys / wheel move one item.
 * No timer-based auto-advance. No wrap.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CarouselSlide } from './CarouselSlide';
import {
  isInPlayerWindow,
  type CarouselAxis,
  type PrototypeCarouselSlide,
} from './types';
import './carousel.css';

interface FeaturedWorkCarouselProps {
  slides: PrototypeCarouselSlide[];
  initialAxis: CarouselAxis;
}

const WHEEL_LOCK_MS = 420;

export function FeaturedWorkCarousel({
  slides,
  initialAxis,
}: FeaturedWorkCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const wheelLockRef = useRef(false);
  const [axis, setAxis] = useState<CarouselAxis>(initialAxis);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncAxisParam = useCallback((next: CarouselAxis) => {
    const url = new URL(window.location.href);
    url.searchParams.set('axis', next);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const slide = slideRefs.current[index];
    if (!slide) return;
    slide.scrollIntoView({
      behavior: 'auto',
      block: 'start',
      inline: 'start',
    });
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (!slides.length) return;
      const next = Math.min(Math.max(index, 0), slides.length - 1);
      setActiveIndex(next);
      scrollToIndex(next);
    },
    [scrollToIndex, slides.length],
  );

  const setAxisAndKeepPage = useCallback(
    (next: CarouselAxis) => {
      if (next === axis) return;
      setAxis(next);
      syncAxisParam(next);
    },
    [axis, syncAxisParam],
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
    };
  }, []);

  useEffect(() => {
    scrollToIndex(activeIndex);
    // Restore the current page after the scroller remounts for an axis swap.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- axis change only
  }, [axis]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.index);
        if (Number.isFinite(index)) setActiveIndex(index);
      },
      { root: scroller, threshold: [0.6, 0.9] },
    );

    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide);
    }

    return () => observer.disconnect();
  }, [axis, slides.length]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (wheelLockRef.current) return;

      const primary =
        axis === 'horizontal' && Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (Math.abs(primary) < 8) return;

      wheelLockRef.current = true;
      goTo(activeIndex + (primary > 0 ? 1 : -1));
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, WHEEL_LOCK_MS);
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => scroller.removeEventListener('wheel', onWheel);
  }, [activeIndex, axis, goTo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        goTo(activeIndex + 1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        goTo(activeIndex - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        goTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        goTo(slides.length - 1);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, goTo, slides.length]);

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
        <div className="vp-proto-carousel__switch" role="group" aria-label="Carousel axis">
          <button
            type="button"
            className="vp-proto-carousel__switch-btn"
            aria-pressed={axis === 'vertical'}
            onClick={() => setAxisAndKeepPage('vertical')}
          >
            Vertical
          </button>
          <button
            type="button"
            className="vp-proto-carousel__switch-btn"
            aria-pressed={axis === 'horizontal'}
            onClick={() => setAxisAndKeepPage('horizontal')}
          >
            Horizontal
          </button>
        </div>
        <span className="vp-proto-carousel__count">
          {activeIndex + 1} / {slides.length}
        </span>
      </div>

      <div
        key={axis}
        ref={scrollerRef}
        className={`vp-proto-carousel__scroller vp-proto-carousel__scroller--${axis}`}
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
            mountPlayer={isInPlayerWindow(index, activeIndex)}
          />
        ))}
      </div>
    </div>
  );
}
