/**
 * Multi-video case study carousel — sparse Embla strip (no loop, no scrubber,
 * no vertical scroll lock). Active slide reuses Lazy*Player (preloaded iframe
 * for Vimeo); peek taps only scrollTo. Desktop pages on horizontal-dominant
 * trackpad/mouse-wheel without claiming vertical page scroll.
 */

'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import {WheelGestures} from 'wheel-gestures';
import {LazyYouTubePlayer} from '@/components/ui/LazyYouTubePlayer';
import {LazyVimeoPlayer} from './LazyVimeoPlayer';
import {LazyXinpianchangPlayer} from './LazyXinpianchangPlayer';
import type {PortfolioCaseSlide} from './prepare-portfolio-case-slides';
import './portfolio-case-carousel.css';

const CASE_DESKTOP_MQ = '(min-width: 768px)';
/** In-gesture |deltaX| before paging; vertical page scroll is never claimed. */
const WHEEL_GESTURE_THRESHOLD_PX = 30;

function caseEmblaOptions(align: 'start' | 'center') {
  return {
    dragFree: false as const,
    loop: false as const,
    align,
    containScroll: false as const,
  };
}

interface PortfolioCaseCarouselProps {
  slides: PortfolioCaseSlide[];
}

function SlideTitleOverlay({title}: {title?: string}) {
  if (!title) return null;
  return (
    <div className="vp-case-carousel__overlay">
      <div className="vp-case-carousel__overlay-scrim" aria-hidden />
      <div className="vp-case-carousel__overlay-copy">
        <p className="vp-case-carousel__title">{title}</p>
      </div>
    </div>
  );
}

function PeekPoster({
  posterUrl,
  onActivate,
}: {
  posterUrl?: string;
  onActivate: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="vp-case-carousel__peek"
      onClick={onActivate}
      aria-label="Show this video"
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt=""
          fill
          className="vp-case-carousel__peek-img"
          sizes="(max-width: 992px) 85vw, 70vw"
        />
      ) : (
        <span className="vp-case-carousel__peek-fallback" aria-hidden />
      )}
      <span className="vp-case-carousel__play-affordance" aria-hidden>
        <span className="vp-case-carousel__play-circle">
          <span className="vp-case-carousel__play-triangle" />
        </span>
      </span>
    </button>
  );
}

function ActiveSlidePlayer({slide}: {slide: PortfolioCaseSlide}) {
  if (slide.kind === 'vimeo') {
    return (
      <LazyVimeoPlayer vimeoUrl={slide.vimeoUrl} posterUrl={slide.posterUrl} />
    );
  }
  if (slide.kind === 'youtube') {
    return <LazyYouTubePlayer videoId={slide.videoId} />;
  }
  return (
    <LazyXinpianchangPlayer
      embedUrl={slide.embedUrl}
      posterUrl={slide.posterUrl}
    />
  );
}

export function PortfolioCaseCarousel({slides}: PortfolioCaseCarouselProps) {
  const slideCount = slides.length;
  // Mobile-first center; desktop reInit switches to start (rail-aligned).
  const [emblaRef, emblaApi] = useEmblaCarousel(caseEmblaOptions('center'));
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const dragGuardRef = useRef<{x: number; y: number} | null>(null);
  const gestureAccumRef = useRef(0);
  const gestureFiredRef = useRef(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setIsInfoOpen(false);
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

  useEffect(() => {
    if (!emblaApi) return;
    const mq = window.matchMedia(CASE_DESKTOP_MQ);
    const syncAlign = () => {
      emblaApi.reInit(caseEmblaOptions(mq.matches ? 'start' : 'center'));
    };
    syncAlign();
    mq.addEventListener('change', syncAlign);
    return () => mq.removeEventListener('change', syncAlign);
  }, [emblaApi]);

  // Horizontal-only wheel paging: leave vertical-dominant gestures to the page.
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

      // Horizontal-only: leave vertical-dominant gestures to the page.
      if (Math.abs(deltaX) <= Math.abs(deltaY) || deltaX === 0) return;

      event.preventDefault?.();

      if (isMomentum) return;

      gestureAccumRef.current += Math.abs(deltaX);
      if (gestureFiredRef.current) return;
      if (gestureAccumRef.current < WHEEL_GESTURE_THRESHOLD_PX) return;

      gestureFiredRef.current = true;
      if (deltaX > 0) {
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

      if (key === 'Escape' && isInfoOpen) {
        event.preventDefault();
        setIsInfoOpen(false);
        return;
      }

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
  }, [emblaApi, isInfoOpen]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollToIndex = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  const onCardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragGuardRef.current = {x: event.clientX, y: event.clientY};
  };

  const onPeekActivate = (
    index: number,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const start = dragGuardRef.current;
    if (
      start &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10
    ) {
      return;
    }
    scrollToIndex(index);
  };

  /** Same as Lazy* play: plain click; stopPropagation so Embla/play ignore it. */
  const onInfoToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setIsInfoOpen((open) => !open);
  };

  if (slideCount < 2) return null;

  return (
    <div className="vp-case-carousel">
      <p
        className="vp-case-carousel__counter"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="vp-case-carousel__counter-current">
          {activeIndex + 1}
        </span>
        <span className="vp-case-carousel__counter-sep" aria-hidden>
          /
        </span>
        <span className="vp-case-carousel__counter-total">{slideCount}</span>
      </p>
      <div className="vp-case-carousel__stage">
        <button
          type="button"
          className="vp-case-carousel__nav vp-case-carousel__nav--prev"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Previous video"
        >
          <NavChevron direction="prev" />
        </button>
        <div
          ref={emblaRef}
          className="vp-case-carousel__viewport"
          aria-label="Campaign videos"
        >
          <div className="vp-case-carousel__container">
            {slides.map((slide, index) => {
              const active = index === activeIndex;
              const showInfo = active && Boolean(slide.description?.trim());
              return (
                <div
                  key={slide.key}
                  className={`vp-case-carousel__slide${active ? ' is-active' : ''}`}
                  onPointerDown={onCardPointerDown}
                >
                  <div className="vp-case-carousel__card">
                    {active ? (
                      <ActiveSlidePlayer slide={slide} />
                    ) : (
                      <PeekPoster
                        posterUrl={slide.posterUrl}
                        onActivate={(event) => onPeekActivate(index, event)}
                      />
                    )}
                    <SlideTitleOverlay title={slide.overlayTitle} />
                    {showInfo ? (
                      <>
                        {isInfoOpen ? (
                          <div
                            className="vp-case-carousel__info-panel"
                            role="dialog"
                            aria-label="Video description"
                          >
                            <div className="vp-case-carousel__info-panel-body">
                              <p className="vp-case-carousel__info-text">
                                {slide.description}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          className={`vp-case-carousel__info-btn${
                            isInfoOpen ? ' is-open' : ''
                          }`}
                          onClick={onInfoToggle}
                          aria-label={isInfoOpen ? 'Close info' : 'More info'}
                          aria-expanded={isInfoOpen}
                        >
                          {isInfoOpen ? (
                            <InfoCloseIcon />
                          ) : (
                            <InfoOpenIcon />
                          )}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          className="vp-case-carousel__nav vp-case-carousel__nav--next"
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Next video"
        >
          <NavChevron direction="next" />
        </button>
      </div>
    </div>
  );
}

function InfoOpenIcon() {
  return (
    <svg
      className="vp-case-carousel__info-icon"
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 10.75v5.5M12 7.75h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoCloseIcon() {
  return (
    <svg
      className="vp-case-carousel__info-icon"
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path
        d="M7.5 7.5 16.5 16.5M16.5 7.5 7.5 16.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

function NavChevron({direction}: {direction: 'prev' | 'next'}) {
  return (
    <svg
      className="vp-case-carousel__nav-icon"
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path
        d={
          direction === 'prev'
            ? 'M14.5 5.5 8 12l6.5 6.5'
            : 'M9.5 5.5 16 12l-6.5 6.5'
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
