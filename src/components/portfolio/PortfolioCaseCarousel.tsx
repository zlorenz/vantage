/**
 * Multi-video case study carousel — sparse Embla strip (no loop, no scrubber,
 * no vertical scroll lock). Centered slide reuses Lazy*Player (preloaded
 * iframe for Vimeo); peek taps only scrollTo.
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
import {LazyYouTubePlayer} from '@/components/ui/LazyYouTubePlayer';
import {LazyVimeoPlayer} from './LazyVimeoPlayer';
import {LazyXinpianchangPlayer} from './LazyXinpianchangPlayer';
import type {PortfolioCaseSlide} from './prepare-portfolio-case-slides';
import './portfolio-case-carousel.css';

const CASE_EMBLA_OPTIONS = {
  dragFree: false as const,
  loop: false as const,
  align: 'center' as const,
  containScroll: false as const,
};

interface PortfolioCaseCarouselProps {
  slides: PortfolioCaseSlide[];
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
  const [emblaRef, emblaApi] = useEmblaCarousel(CASE_EMBLA_OPTIONS);
  const [activeIndex, setActiveIndex] = useState(0);
  const dragGuardRef = useRef<{x: number; y: number} | null>(null);

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
      <div
        ref={emblaRef}
        className="vp-case-carousel__viewport"
        aria-label="Campaign videos"
      >
        <div className="vp-case-carousel__container">
          {slides.map((slide, index) => {
            const active = index === activeIndex;
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
