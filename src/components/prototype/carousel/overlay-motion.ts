/** Max overlay lag at half a slide of drag. Tune on-device in the 8–12px range. */
export const OVERLAY_DEPTH_MAX_PX = 10;

/** True when the engine fires `scrollend` on this target (window or a scroller). */
export function supportsScrollEnd(target: EventTarget = window): boolean {
  return 'onscrollend' in target;
}

export function snapIndexFromScroll(
  scrollTop: number,
  slideHeight: number,
  lastIndex: number,
): number {
  if (slideHeight <= 0 || lastIndex <= 0) {
    return 0;
  }
  return Math.min(lastIndex, Math.max(0, Math.round(scrollTop / slideHeight)));
}

/**
 * Direct (uneased) lag of a slide's overlay vs its snap point.
 * 0 at rest; ±maxPx at ±50% of slide height; clamped beyond that.
 */
export function overlayDepthOffsetPx(
  scrollTop: number,
  slideIndex: number,
  slideHeight: number,
  maxPx: number = OVERLAY_DEPTH_MAX_PX,
): number {
  if (slideHeight <= 0 || maxPx <= 0) return 0;
  const delta = scrollTop - slideIndex * slideHeight;
  const scaled = (delta * 2 * maxPx) / slideHeight;
  if (Math.abs(scaled) < 0.1) return 0;
  return Math.max(-maxPx, Math.min(maxPx, scaled));
}
