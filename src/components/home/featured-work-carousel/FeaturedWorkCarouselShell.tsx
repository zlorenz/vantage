'use client';

/**
 * Entry for the featured-work carousel (Embla + wheel-gestures + keyboard).
 */

import {FeaturedWorkCarousel} from './FeaturedWorkCarousel';
import type {FeaturedWorkSlide} from './types';

interface FeaturedWorkCarouselShellProps {
  slides: FeaturedWorkSlide[];
}

export function FeaturedWorkCarouselShell({slides}: FeaturedWorkCarouselShellProps) {
  return <FeaturedWorkCarousel slides={slides} />;
}
