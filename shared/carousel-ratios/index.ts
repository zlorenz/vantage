/**
 * Card aspect ratios (width / height) for hotspot guides + poster URL bakes.
 *
 * Single source of truth: Studio hotspot guides, Sanity CDN crop sizes, and
 * frontend CSS aspect-ratio all pull from here. Update one place and the whole
 * pipeline stays consistent — no more “fix hotspot → resurface too-tight crop.”
 *
 * Values are round integers — most are live DevTools measurements (Zach);
 * workMobile is a deliberately chosen simple ratio (2:3) picked after a
 * frontend width experiment, ~18% wider than the originally measured card.
 * Pixel-exact is not required; the CSS aspect-ratio matches the CDN bake so
 * `object-fit` never has to do a second crop.
 */

export type CarouselRatio = {
  /** Human label for Studio guide tabs. */
  title: string
  /** Ratio numerator (width). */
  w: number
  /** Ratio denominator (height). */
  h: number
  /** Guide overlay stroke color in Studio. */
  color: string
}

/**
 * Order matters: narrowest-first so the Studio dialog opens on the tightest
 * crop by default (best UX for accurate hotspot placement).
 */
export const CAROUSEL_RATIOS = {
  workMobile: {
    title: 'Full Portfolio Cards (Mobile)',
    w: 324,
    h: 486,
    color: 'rgba(80, 220, 160, 0.95)',
  },
  homeMobile: {
    title: 'Homepage Cards (Mobile)',
    w: 440,
    h: 796,
    color: 'rgba(220, 120, 255, 0.95)',
  },
  workDesktop: {
    title: 'Full Portfolio Cards (Desktop)',
    w: 520,
    h: 673,
    color: 'rgba(249, 219, 36, 0.95)',
  },
  homeDesktop: {
    title: 'Homepage Cards (Desktop)',
    w: 16,
    h: 9,
    color: 'rgba(100, 180, 255, 0.95)',
  },
} as const satisfies Record<string, CarouselRatio>

/** Ordered list for Studio guide tabs (default = first). */
export const CAROUSEL_RATIO_LIST: readonly CarouselRatio[] = [
  CAROUSEL_RATIOS.workMobile,
  CAROUSEL_RATIOS.homeMobile,
  CAROUSEL_RATIOS.workDesktop,
  CAROUSEL_RATIOS.homeDesktop,
]

/** Convenience: width / height as a floating-point number. */
export function ratioValue(r: CarouselRatio): number {
  return r.w / r.h
}

/**
 * Sanity CDN crop size at a given DPR multiple. Round to keep URLs cache-stable
 * across viewports — feeding a slightly different width every request would
 * cold-hit the Sanity transform pipeline over and over.
 */
export function posterSize(
  r: CarouselRatio,
  scale = 2,
): {width: number; height: number} {
  return {
    width: Math.round(r.w * scale),
    height: Math.round(r.h * scale),
  }
}

/**
 * CSS object-position from a Sanity image hotspot (0–1 axes).
 * Shared by homepage and /work slide prep so Studio hotspots map the same way.
 */
export type CarouselHotspot = {
  x?: number
  y?: number
}

export function objectPositionFromHotspot(
  hotspot: CarouselHotspot | undefined,
): string {
  const x =
    typeof hotspot?.x === 'number' && Number.isFinite(hotspot.x)
      ? Math.min(1, Math.max(0, hotspot.x))
      : 0.5
  const y =
    typeof hotspot?.y === 'number' && Number.isFinite(hotspot.y)
      ? Math.min(1, Math.max(0, hotspot.y))
      : 0.5
  return `${x * 100}% ${y * 100}%`
}
