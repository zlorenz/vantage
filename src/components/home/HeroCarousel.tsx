'use client';

/**
 * HeroCarousel — full-viewport homepage hero with crossfade slides.
 *
 * Client component: auto-advance (6s), pause on hover, swipe on touch,
 * dot indicators, prev/next arrows (desktop). Slide data fetched
 * server-side and passed as props.
 */

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { VpButton } from '@/components/ui/VpButton';
import { phraseRecordToMap } from '@phrase-book';
import { resolveEntryDisplayTitles } from '@/lib/display-titles';
import { urlForImage } from '@/lib/sanity';
import type { HeroSlideData } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

interface HeroCarouselProps {
  slides: HeroSlideData[];
  locale: Locale;
  phrases?: Record<string, string>;
}

const INTERVAL_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

export function HeroCarousel({ slides, locale, phrases }: HeroCarouselProps) {
  const t = useTranslations('Home');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (!slides.length) return;
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Auto-advance every 6 seconds; pauses while hovered or mid-swipe.
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = window.setInterval(goNext, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, isPaused, goNext]);

  function onTouchStart(e: TouchEvent) {
    if (slides.length <= 1) return;
    touchStartX.current = e.touches[0]?.clientX ?? null;
    setIsPaused(true);
  }

  function onTouchEnd(e: TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    setIsPaused(false);
    if (startX == null || slides.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX;
    if (endX == null) return;
    const dx = endX - startX;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  function onTouchCancel() {
    touchStartX.current = null;
    setIsPaused(false);
  }

  if (!slides.length) return null;

  return (
    <section
      className="vp-hero-carousel relative h-screen w-full overflow-hidden touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      aria-label={t('heroCarouselAria')}
    >
      {/* Slide backgrounds — crossfade via opacity */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => {
          const imageUrl = urlForImage(slide.featuredImage)
            .width(1920)
            .height(1080)
            .fit('crop')
            .url();
          return (
            <div
              key={index}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: index === activeIndex ? 1 : 0 }}
              aria-hidden={index !== activeIndex}
            >
              <Image
                src={imageUrl}
                alt=""
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
              />
              <div className="vp-hero-carousel__overlay absolute inset-0 bg-vp-hero-carousel-overlay" />
            </div>
          );
        })}
      </div>

      {/* Slide copy — vertically centred */}
      <div className="vp-hero-carousel__copy pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
        {slides.map((slide, index) => {
          const slugParam =
            locale === 'zh' ? slide.slugZh || slide.slug : slide.slug;
          const description =
            locale === 'zh' && slide.descriptionZh
              ? slide.descriptionZh
              : slide.description;
          const headerTitle = resolveEntryDisplayTitles(
            slide,
            locale,
            phraseRecordToMap(phrases),
          ).headerTitle;

          return (
            <div
              key={index}
              className="container absolute flex w-full flex-col items-center justify-center px-4 text-center text-white transition-opacity duration-700 ease-in-out min-[1400px]:max-w-[1320px]"
              style={{ opacity: index === activeIndex ? 1 : 0 }}
              aria-hidden={index !== activeIndex}
            >
              <h1
                className="vp-hero-carousel__title mb-4 font-vp-heading text-[clamp(2.375rem,1.25rem+2.7vw,3.4375rem)] font-extrabold uppercase leading-tight tracking-vp-heading"
                dangerouslySetInnerHTML={{ __html: headerTitle }}
              />
              {description ? (
                <p className="vp-hero-carousel__desc mx-auto mb-8 max-w-2xl text-base font-light leading-relaxed text-white/90">
                  {description}
                </p>
              ) : null}
              <VpButton
                href={{
                  pathname: '/portfolio/[slug]',
                  params: { slug: slugParam },
                }}
                variant="ghost"
                className={`inline-flex items-center gap-2 ${
                  index === activeIndex
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'
                }`}
              >
                <span aria-hidden>▶</span>
                {t('watchButton')}
              </VpButton>
            </div>
          );
        })}
      </div>

      {/* Dot indicators — bottom centre */}
      <div className="vp-hero-carousel__indicators absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`h-0.5 rounded-none border-0 bg-white transition-all duration-300 ${
              index === activeIndex ? 'w-10 opacity-100' : 'w-5 opacity-40'
            }`}
            onClick={() => goTo(index)}
            aria-label={t('goToSlide', { index: index + 1 })}
            aria-current={index === activeIndex ? 'true' : undefined}
          />
        ))}
      </div>

      {/* Prev / next arrows — desktop only (CSS hides on mobile; swipe handles nav) */}
      {slides.length > 1 ? (
        <>
          <button
            type="button"
            className="vp-hero-carousel__arrow vp-hero-carousel__arrow--prev absolute left-4 top-1/2 z-20 -translate-y-1/2 border-0 bg-transparent p-4 text-white opacity-80 transition-opacity hover:opacity-100 md:left-8"
            onClick={goPrev}
            aria-label={t('previousSlide')}
          >
            <span className="vp-hero-carousel__chevron vp-hero-carousel__chevron--left" />
          </button>
          <button
            type="button"
            className="vp-hero-carousel__arrow vp-hero-carousel__arrow--next absolute right-4 top-1/2 z-20 -translate-y-1/2 border-0 bg-transparent p-4 text-white opacity-80 transition-opacity hover:opacity-100 md:right-8"
            onClick={goNext}
            aria-label={t('nextSlide')}
          >
            <span className="vp-hero-carousel__chevron vp-hero-carousel__chevron--right" />
          </button>
        </>
      ) : null}
    </section>
  );
}
