export type PrototypeCarouselSlide = {
  slug: string;
  brandLine: string;
  campaignLine: string;
  directorNames: string;
  dopNames: string;
  formatLine: string;
  posterUrl: string | null;
  vimeoUrl: string | null;
};

/** Current item plus one neighbor on each side (window of 3; 2 at the ends). */
export function isInPlayerWindow(index: number, activeIndex: number): boolean {
  return Math.abs(index - activeIndex) <= 1;
}
