/**
 * Carousel native-video preload — mobile inactive neighbors fetch metadata only.
 * Desktop (≥768px, same breakpoint as cover-math) keeps preload="auto" everywhere.
 */

/** Preload for mounted carousel slides. Active slide is always auto. */
export function carouselVideoPreload(
  active: boolean,
  desktopViewport: boolean,
): 'auto' | 'metadata' {
  if (active) return 'auto';
  return desktopViewport ? 'auto' : 'metadata';
}
