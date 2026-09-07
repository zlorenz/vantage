/**
 * PortfolioCaseCarouselRailNav — rail-width column beside the multi-video
 * carousel (Figma 149:22173). Counter + prev/next share the Embla instance
 * exposed by PortfolioCaseCarousel via onApiChange.
 *
 * Not an extension of PortfolioCaseRail — carousel chrome is a sibling of the
 * carousel, not part of the header back/mark rail.
 */

import './portfolio-case-carousel-rail-nav.css';

export type PortfolioCaseCarouselRailNavProps = {
  /** 0-based index from the shared Embla instance. */
  selectedIndex?: number;
  slideCount?: number;
  canScrollPrev?: boolean;
  canScrollNext?: boolean;
  scrollPrev?: () => void;
  scrollNext?: () => void;
};

function formatSlideNumber(n: number) {
  return String(n).padStart(2, '0');
}

function RailNavChevron({direction}: {direction: 'prev' | 'next'}) {
  return (
    <svg
      className="vp-case-carousel-rail-nav__icon"
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

export function PortfolioCaseCarouselRailNav({
  selectedIndex = 0,
  slideCount = 0,
  scrollPrev,
  scrollNext,
}: PortfolioCaseCarouselRailNavProps = {}) {
  const current = Math.max(1, selectedIndex + 1);
  const total = Math.max(0, slideCount);

  return (
    <aside className="vp-case-carousel-rail-nav" aria-label="Carousel controls">
      <p
        className="vp-case-carousel-rail-nav__counter"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="vp-case-carousel-rail-nav__counter-current">
          {formatSlideNumber(current)}
        </span>
        <span className="vp-case-carousel-rail-nav__counter-sep">/</span>
        <span className="vp-case-carousel-rail-nav__counter-total">
          {formatSlideNumber(total)}
        </span>
      </p>
      <div className="vp-case-carousel-rail-nav__arrows">
        <button
          type="button"
          className="vp-case-carousel-rail-nav__btn vp-case-carousel-rail-nav__btn--prev"
          onClick={scrollPrev}
          aria-label="Previous video"
        >
          <RailNavChevron direction="prev" />
        </button>
        <button
          type="button"
          className="vp-case-carousel-rail-nav__btn vp-case-carousel-rail-nav__btn--next"
          onClick={scrollNext}
          aria-label="Next video"
        >
          <RailNavChevron direction="next" />
        </button>
      </div>
    </aside>
  );
}
