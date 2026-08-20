'use client';

/**
 * Entry for the featured-work carousel. One Embla engine for all pointer types.
 */

import {FeaturedWorkCarouselTouch} from './FeaturedWorkCarouselTouch';
import type {PrototypeCarouselSlide} from './types';

interface FeaturedWorkCarouselShellProps {
  slides: PrototypeCarouselSlide[];
}

export function FeaturedWorkCarouselShell({slides}: FeaturedWorkCarouselShellProps) {
  return <FeaturedWorkCarouselTouch slides={slides} />;
}
