/**
 * Scroll hand-off between the carousel's nested scroller and the page.
 *
 * The nested scroller can always scroll to another slide internally, so native
 * overscroll chaining never fires while it remains interactive. Use
 * isCarouselScrollActive() (viewport visibility) as the single gate for wheel,
 * keys, and touch — when inactive, the scroller must not capture input.
 *
 * At the first/last slide, a continued gesture in the outbound direction must
 * go passive immediately. Waiting for document scroll lets mandatory snap fight
 * overscroll chaining and feels sticky.
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

/** +1 = released past the last slide; -1 = released past the first. */
export type BoundaryLatchDirection = 1 | -1;

/**
 * Return-only recovery from Contact. Separate from isCarouselScrollActive —
 * does not use CAROUSEL_ACTIVE_TOP_MIN_PX. Reverse = deltaY < 0.
 *
 * Matches: last-slide outbound latch (+1), or last slide, passive, mostly
 * on-screen (ratio ≥ 0.85, rootTop ≤ 96). Does not match deep in Contact
 * (low ratio, latch already null) or an active carousel (live paging).
 */
export function isCarouselReturnRecovery(options: {
  latchDirection: BoundaryLatchDirection | null;
  carouselActive: boolean;
  activeIndex: number;
  lastIndex: number;
  deltaY: number;
  rootTop: number;
  intersectionRatio: number;
}): boolean {
  const {
    latchDirection,
    carouselActive,
    activeIndex,
    lastIndex,
    deltaY,
    rootTop,
    intersectionRatio,
  } = options;
  if (deltaY >= 0) return false;
  if (latchDirection === 1) return true;
  if (carouselActive) return false;
  if (activeIndex < lastIndex) return false;
  if (intersectionRatio < CAROUSEL_ACTIVE_INTERSECTION_MIN) return false;
  if (rootTop > CAROUSEL_ACTIVE_TOP_MAX_PX) return false;
  return true;
}

export function boundaryLatchDirection(
  deltaY: number,
): BoundaryLatchDirection | null {
  if (deltaY > 0) return 1;
  if (deltaY < 0) return -1;
  return null;
}

/**
 * Keep a boundary latch only while the current index still sits on that
 * edge. A mid-sequence latch (false-positive or stale) must not persist.
 */
export function shouldKeepBoundaryLatch(options: {
  direction: BoundaryLatchDirection;
  activeIndex: number;
  lastIndex: number;
}): boolean {
  const {direction, activeIndex, lastIndex} = options;
  if (direction > 0) return activeIndex >= lastIndex;
  return activeIndex <= 0;
}

/** True when a vertical gesture would leave the carousel past first/last slide. */
export function isBoundaryRelease(options: {
  activeIndex: number;
  lastIndex: number;
  deltaY: number;
}): boolean {
  const {activeIndex, lastIndex, deltaY} = options;
  const direction = boundaryLatchDirection(deltaY);
  if (!direction) return false;
  return shouldKeepBoundaryLatch({direction, activeIndex, lastIndex});
}

export function shouldReleaseWheelToPage(options: {
  carouselActive: boolean;
  activeIndex: number;
  lastIndex: number;
  deltaY: number;
}): boolean {
  const {carouselActive, activeIndex, lastIndex, deltaY} = options;
  if (!carouselActive) return true;
  return isBoundaryRelease({activeIndex, lastIndex, deltaY});
}

export function shouldReleaseKeyToPage(options: {
  carouselActive: boolean;
  activeIndex: number;
  lastIndex: number;
  key: string;
}): boolean {
  const {carouselActive, activeIndex, lastIndex, key} = options;
  if (!carouselActive) return true;
  if (key === 'ArrowDown' || key === 'PageDown' || key === 'End') {
    return isBoundaryRelease({activeIndex, lastIndex, deltaY: 1});
  }
  if (key === 'ArrowUp' || key === 'PageUp' || key === 'Home') {
    return isBoundaryRelease({activeIndex, lastIndex, deltaY: -1});
  }
  return false;
}

