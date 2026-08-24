export type PrototypeCarouselSlide = {
  slug: string;
  hrefSlug: string;
  brandLine: string;
  campaignLine: string;
  directorNames: string;
  dopNames: string;
  formatLine: string;
  posterUrl: string | null;
  /** Desktop (≥768px) — 16:9 Sanity crop matching Homepage Cards (Desktop). */
  posterUrlDesktop: string | null;
  /** CSS object-position from featuredImage hotspot (e.g. "42% 55%"). */
  objectPosition: string;
  vimeoUrl: string | null;
  previewStartSeconds: number | null;
  previewEndSeconds: number | null;
};

/** Wrap an index into [0, count). count <= 0 → 0. */
export function wrapSlideIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

/**
 * Current item plus one neighbor on each side (window of 3).
 * Neighbors wrap: last is adjacent to first.
 */
export function isInPlayerWindow(
  index: number,
  activeIndex: number,
  slideCount: number,
): boolean {
  if (slideCount <= 0) return false;
  const dist = Math.abs(index - activeIndex);
  return Math.min(dist, slideCount - dist) <= 1;
}

/**
 * Mount the active slide immediately. Keep already-in-window neighbors.
 * Defer a newly entering far neighbor until neighborMountIndex catches up
 * after the page transition settles.
 */
export function shouldMountCarouselPlayer(
  index: number,
  activeIndex: number,
  neighborMountIndex: number,
  slideCount: number,
): boolean {
  if (!isInPlayerWindow(index, activeIndex, slideCount)) return false;
  if (index === activeIndex) return true;
  return isInPlayerWindow(index, neighborMountIndex, slideCount);
}
