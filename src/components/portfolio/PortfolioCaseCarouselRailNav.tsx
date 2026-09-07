/**
 * PortfolioCaseCarouselRailNav — rail-width column beside the multi-video
 * carousel (Figma 149:22173). Props wire the same Embla instance as the
 * sibling carousel; counter + prev/next UI land in later Phase 3 commits.
 *
 * Not an extension of PortfolioCaseRail — carousel chrome is a sibling of the
 * carousel, not part of the header back/mark rail.
 */

import './portfolio-case-carousel.css';

export type PortfolioCaseCarouselRailNavProps = {
  /** 0-based index from the shared Embla instance. */
  selectedIndex?: number;
  slideCount?: number;
  canScrollPrev?: boolean;
  canScrollNext?: boolean;
  scrollPrev?: () => void;
  scrollNext?: () => void;
};

export function PortfolioCaseCarouselRailNav({
  selectedIndex: _selectedIndex = 0,
  slideCount: _slideCount = 0,
  canScrollPrev: _canScrollPrev = false,
  canScrollNext: _canScrollNext = false,
  scrollPrev: _scrollPrev,
  scrollNext: _scrollNext,
}: PortfolioCaseCarouselRailNavProps = {}) {
  return (
    <aside
      className="vp-case-carousel-rail-nav"
      aria-hidden="true"
      data-placeholder="carousel-rail-nav"
    />
  );
}
