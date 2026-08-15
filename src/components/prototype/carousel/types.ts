export type CarouselAxis = 'vertical' | 'horizontal';

export type PrototypeCarouselSlide = {
  slug: string;
  titleHtml: string;
  posterUrl: string | null;
  vimeoUrl: string | null;
};

export function isCarouselAxis(value: string | null | undefined): value is CarouselAxis {
  return value === 'vertical' || value === 'horizontal';
}

/** Current item plus one neighbor on each side (window of 3; 2 at the ends). */
export function isInPlayerWindow(index: number, activeIndex: number): boolean {
  return Math.abs(index - activeIndex) <= 1;
}
