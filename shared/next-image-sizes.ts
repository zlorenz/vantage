/**
 * Allowed next/image optimizer widths — must match next.config.ts images.*Sizes.
 * Next.js 16 returns 400 (INVALID_IMAGE_OPTIMIZE_REQUEST) for unlisted widths.
 */

export const NEXT_IMAGE_DEVICE_SIZES = [
  640, 750, 828, 960, 1080, 1200, 1920, 2048, 3840,
] as const;

export const NEXT_IMAGE_SIZES = [
  16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 960,
] as const;

const ALL_ALLOWED_WIDTHS = [
  ...NEXT_IMAGE_SIZES,
  ...NEXT_IMAGE_DEVICE_SIZES,
] as const;

/** Snap arbitrary Sanity dimensions to the nearest allowed optimizer width. */
export function snapNextImageWidth(requested: number): number {
  const clamped = Math.max(16, Math.min(requested, 3840));
  let best: number = ALL_ALLOWED_WIDTHS[0];
  for (const width of ALL_ALLOWED_WIDTHS) {
    if (Math.abs(width - clamped) < Math.abs(best - clamped)) {
      best = width;
    }
  }
  return best;
}
