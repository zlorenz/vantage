/**
 * Scroll hand-off between the carousel's nested scroller and the page.
 *
 * The nested scroller can always scroll to another slide internally, so native
 * overscroll chaining never fires while it remains interactive. Use
 * isCarouselScrollActive() (viewport visibility) as the single gate for wheel,
 * keys, and touch — when inactive, the scroller must not capture input.
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

export function shouldReleaseWheelToPage(options: {
  carouselActive: boolean;
  activeIndex: number;
  lastIndex: number;
  deltaY: number;
}): boolean {
  const {carouselActive, activeIndex, lastIndex, deltaY} = options;
  if (!carouselActive) return true;
  if (deltaY < 0 && activeIndex <= 0) return true;
  if (deltaY > 0 && activeIndex >= lastIndex) return true;
  return false;
}

export function shouldReleaseKeyToPage(options: {
  carouselActive: boolean;
  activeIndex: number;
  lastIndex: number;
  key: string;
}): boolean {
  const {carouselActive, activeIndex, lastIndex, key} = options;
  if (!carouselActive) return true;
  if ((key === 'ArrowDown' || key === 'PageDown') && activeIndex >= lastIndex) {
    return true;
  }
  if ((key === 'ArrowUp' || key === 'PageUp') && activeIndex <= 0) {
    return true;
  }
  if (key === 'Home' && activeIndex <= 0) return true;
  if (key === 'End' && activeIndex >= lastIndex) return true;
  return false;
}
