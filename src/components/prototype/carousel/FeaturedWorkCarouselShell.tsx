'use client';

/**
 * Entry for the featured-work carousel (Embla + wheel-gestures + keyboard).
 */

import {FeaturedWorkCarousel} from './FeaturedWorkCarousel';
import type {PrototypeCarouselSlide} from './types';

interface FeaturedWorkCarouselShellProps {
  slides: PrototypeCarouselSlide[];
}

export function FeaturedWorkCarouselShell({slides}: FeaturedWorkCarouselShellProps) {
  return <FeaturedWorkCarousel slides={slides} />;
}
