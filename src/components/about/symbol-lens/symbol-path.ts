/**
 * Path data from design/assets/Logo Collage/symbol-collage-fix2.svg
 * (viewBox 0 0 88.7 88.7). Used as Path2D for the white base layer and
 * destination-in mosaic mask.
 */

export const SYMBOL_VIEWBOX_W = 88.7;
export const SYMBOL_VIEWBOX_H = 88.7;

/**
 * Polygon from symbol-collage-fix2.svg — Vantage mark.
 *
 * The source AI pinch at the A-counter apex is opened to a 0.70-unit gap
 * between (44.70, 33.16) and (44.00, 33.16). At the ~372px loupe work buffer
 * that yields ≥2 genuinely transparent texels (confirmed by mask-only
 * diagnostic) so the joint stays non-singular under warp/magnification.
 */
export const SYMBOL_PATH_D =
  "M32.28,0 L44.7,33.16 L56.5,66.53 L28.48,76.73 L44,33.16 L20.2,33.16 L0,88.7 L88.7,88.7 L56.42,0 L32.28,0 Z";

let cachedPath: Path2D | null = null;

export function getSymbolPath(): Path2D {
  if (!cachedPath) {
    cachedPath = new Path2D(SYMBOL_PATH_D);
  }
  return cachedPath;
}
