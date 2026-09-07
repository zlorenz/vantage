'use client';

/**
 * Client shell for multi-video case pages: rail-nav + carousel share one Embla
 * instance via onApiChange (same source of truth for swipe and rail buttons).
 */

import {useCallback, useState} from 'react';
import {
  PortfolioCaseCarousel,
  type PortfolioCaseCarouselApi,
} from '@/components/portfolio/PortfolioCaseCarousel';
import {PortfolioCaseCarouselRailNav} from '@/components/portfolio/PortfolioCaseCarouselRailNav';
import type {PortfolioCaseSlide} from '@/components/portfolio/prepare-portfolio-case-slides';

type PortfolioCaseCarouselWithRailProps = {
  slides: PortfolioCaseSlide[];
};

export function PortfolioCaseCarouselWithRail({
  slides,
}: PortfolioCaseCarouselWithRailProps) {
  const [api, setApi] = useState<PortfolioCaseCarouselApi | null>(null);

  const onApiChange = useCallback((next: PortfolioCaseCarouselApi) => {
    setApi(next);
  }, []);

  return (
    <div className="vp-case-carousel-row">
      <PortfolioCaseCarouselRailNav
        selectedIndex={api?.selectedIndex ?? 0}
        slideCount={api?.slideCount ?? slides.length}
        canScrollPrev={api?.canScrollPrev ?? false}
        canScrollNext={api?.canScrollNext ?? false}
        scrollPrev={api?.scrollPrev}
        scrollNext={api?.scrollNext}
      />
      <div className="vp-case-carousel-row__media">
        <PortfolioCaseCarousel slides={slides} onApiChange={onApiChange} />
      </div>
    </div>
  );
}
