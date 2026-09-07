/**
 * PortfolioCaseCarouselRailNav — rail-width column beside the multi-video
 * carousel (Figma 149:22173). Counter + prev/next share the Embla instance
 * exposed by PortfolioCaseCarouselVia onApiChange.
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

export function PortfolioCaseCarouselRailNav({
  selectedIndex = 0,
  slideCount = 0,
  canScrollPrev: _canScrollPrev = false,
  canScrollNext: _canScrollNext = false,
  scrollPrev: _scrollPrev,
  scrollNext: _scrollNext,
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
        <span className="vp-case-carousel-rail-nav__counter-rest" aria-hidden>
          <span className="vp-case-carousel-rail-nav__counter-sep">/</span>
          <span className="vp-case-carousel-rail-nav__counter-total">
            {formatSlideNumber(total)}
          </span>
        </span>
      </p>
    </aside>
  );
}
