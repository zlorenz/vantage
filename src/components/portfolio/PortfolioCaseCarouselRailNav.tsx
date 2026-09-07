/**
 * PortfolioCaseCarouselRailNav — rail-width column beside the multi-video
 * carousel (Figma 149:22173). Counter + prev/next land in Phase 3; this file
 * only reserves the DOM slot and width token.
 *
 * Not an extension of PortfolioCaseRail — carousel chrome is a sibling of the
 * carousel, not part of the header back/mark rail.
 */

import './portfolio-case-carousel.css';

export function PortfolioCaseCarouselRailNav() {
  return (
    <aside
      className="vp-case-carousel-rail-nav"
      aria-hidden="true"
      data-placeholder="carousel-rail-nav"
    />
  );
}
