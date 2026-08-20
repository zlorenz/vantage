/**
 * Scroll hand-off between the carousel and the page.
 *
 * Use isCarouselScrollActive() (viewport visibility) as the single gate for
 * wheel, keys, and touch — when inactive, the carousel must not capture input.
 */

/** Carousel top may sit slightly below the fixed header while still "active". */
export const CAROUSEL_ACTIVE_TOP_MAX_PX = 96;
/** Allow minor rubber-band / sub-pixel drift at the document top. */
export const CAROUSEL_ACTIVE_TOP_MIN_PX = -8;
/** Fraction of the carousel root that must be visible to count as primary. */
export const CAROUSEL_ACTIVE_INTERSECTION_MIN = 0.85;

export function isCarouselScrollActive(options: {
  rootTop: number;
  intersectionRatio: number;
}): boolean {
  const {rootTop, intersectionRatio} = options;
  return (
    rootTop >= CAROUSEL_ACTIVE_TOP_MIN_PX &&
    rootTop <= CAROUSEL_ACTIVE_TOP_MAX_PX &&
    intersectionRatio >= CAROUSEL_ACTIVE_INTERSECTION_MIN
  );
}
