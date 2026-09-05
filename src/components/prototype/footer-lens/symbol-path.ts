/**
 * Path data from public/brand/vantage-logo.svg (viewBox 0 0 36 36).
 * Used as Path2D for both the white base layer and destination-in mosaic mask.
 */

export const SYMBOL_VIEWBOX_W = 36;
export const SYMBOL_VIEWBOX_H = 36;

/** Polygon from vantage-logo.svg — Vantage mark. */
export const SYMBOL_PATH_D =
  "M13.48,0 L18.01,12.46 L23.48,27.53 L10.83,32.14 L18.01,12.46 L8.56,12.46 L0,36 L36,36 L22.9,0 Z";

let cachedPath: Path2D | null = null;

export function getSymbolPath(): Path2D {
  if (!cachedPath) {
    cachedPath = new Path2D(SYMBOL_PATH_D);
  }
  return cachedPath;
}
