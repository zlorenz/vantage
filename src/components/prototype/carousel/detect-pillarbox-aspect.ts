/**
 * Detect pillarboxed content inside a full-frame still (or video frame).
 * Returns content width/height when side bars are present; otherwise null.
 *
 * Used so cover-math can zoom past coded 16:9 when the master has baked-in
 * left/right black bars (pillarboxing) — the counterpart to ultrawide
 * letterboxing, which only needed the coded aspect.
 *
 * Conservative on purpose: dark-graded footage must not be mistaken for bars
 * (that over-zoomed Mammotion to ~0.59). Require bars on both sides, near-black
 * luma, and a modest max zoom relative to the full frame aspect.
 */

const BLACK_LUMA = 8;
/** Ignore tiny edge noise; require a bar on BOTH sides. */
const MIN_BAR_FRACTION = 0.04;
/** If content already fills ≥96% of width, treat as no pillarbox. */
const MIN_CONTENT_FRACTION = 0.96;
/**
 * Cap zoom: content aspect must stay ≥ this fraction of the full-frame aspect
 * (~25% max width crop). Stops dark scenes from collapsing the cover box.
 */
const MIN_CONTENT_VS_FRAME = 0.75;

function columnMeanLuma(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
): number {
  const y0 = Math.floor(height * 0.2);
  const y1 = Math.floor(height * 0.75);
  let sum = 0;
  let n = 0;
  for (let y = y0; y < y1; y += 2) {
    const i = (y * width + x) * 4;
    sum += (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
    n++;
  }
  return n > 0 ? sum / n : 255;
}

function columnIsBlack(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
): boolean {
  return columnMeanLuma(data, width, height, x) <= BLACK_LUMA;
}

/**
 * @returns Content aspect (width/height) when pillar bars are detected,
 *          or null when the frame is already full-bleed / unscannable.
 */
export function detectPillarboxContentAspect(
  source: CanvasImageSource & {width?: number; height?: number},
  naturalWidth: number,
  naturalHeight: number,
): number | null {
  if (naturalWidth <= 0 || naturalHeight <= 0) return null;

  const canvas = document.createElement('canvas');
  const tw = Math.min(naturalWidth, 480);
  const th = Math.max(1, Math.round(naturalHeight * (tw / naturalWidth)));
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  if (!ctx) return null;

  try {
    ctx.drawImage(source, 0, 0, tw, th);
  } catch {
    return null;
  }

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, tw, th);
  } catch {
    // Tainted canvas (cross-origin without CORS) — cannot scan.
    return null;
  }

  let left = 0;
  while (left < tw && columnIsBlack(data.data, tw, th, left)) left++;
  let right = tw - 1;
  while (right >= 0 && columnIsBlack(data.data, tw, th, right)) right--;

  const contentW = right - left + 1;
  if (contentW <= 0) return null;
  if (contentW / tw >= MIN_CONTENT_FRACTION) return null;

  const leftFrac = left / tw;
  const rightFrac = (tw - 1 - right) / tw;
  // True pillarboxing has bars on both sides — not a dark half of the frame.
  if (leftFrac < MIN_BAR_FRACTION || rightFrac < MIN_BAR_FRACTION) {
    return null;
  }

  const frameAspect = naturalWidth / naturalHeight;
  const contentAspect = (contentW / tw) * frameAspect;
  if (contentAspect < frameAspect * MIN_CONTENT_VS_FRAME) {
    return null;
  }

  // Content band should be clearly brighter than the bars (not just noise).
  const mid = Math.floor((left + right) / 2);
  const barLuma = Math.min(
    columnMeanLuma(data.data, tw, th, Math.floor(left / 2)),
    columnMeanLuma(
      data.data,
      tw,
      th,
      Math.min(tw - 1, right + Math.floor((tw - 1 - right) / 2)),
    ),
  );
  const contentLuma = columnMeanLuma(data.data, tw, th, mid);
  if (contentLuma < barLuma + 12) {
    return null;
  }

  return contentAspect;
}
