export type PrototypeCarouselSlide = {
  slug: string;
  brandLine: string;
  campaignLine: string;
  directorNames: string;
  dopNames: string;
  formatLine: string;
  posterUrl: string | null;
  vimeoUrl: string | null;
  previewStartSeconds: number | null;
  previewEndSeconds: number | null;
};

/** Current item plus one neighbor on each side (window of 3; 2 at the ends). */
export function isInPlayerWindow(index: number, activeIndex: number): boolean {
  return Math.abs(index - activeIndex) <= 1;
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
): boolean {
  if (!isInPlayerWindow(index, activeIndex)) return false;
  if (index === activeIndex) return true;
  return isInPlayerWindow(index, neighborMountIndex);
}
