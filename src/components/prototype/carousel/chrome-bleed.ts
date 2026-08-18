/**
 * Safari 26 Liquid Glass samples document pixels beyond 100lvh up to
 * window.outerHeight. Sync --vp-chrome-bleed so an in-flow black strip can
 * cover the compositing gap without resizing the carousel snap box.
 *
 * Mount + orientationchange only — never wire to visualViewport resize.
 */

const VP_CHROME_BLEED_VAR = '--vp-chrome-bleed';

/** Hidden 100lvh probe — returns large-viewport height in CSS pixels. */
export function probe100lvh(): number {
  if (typeof document === 'undefined') return 0;

  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;height:100lvh;width:0;top:0;left:0;';
  document.documentElement.appendChild(probe);
  const height = probe.offsetHeight;
  probe.remove();
  return height;
}

/** Set --vp-chrome-bleed on :root from outerHeight − 100lvh (min 0). */
export function syncVpChromeBleed(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const root = document.documentElement;
  const outerHeight = window.outerHeight;

  if (!outerHeight || outerHeight <= 0) {
    root.style.setProperty(VP_CHROME_BLEED_VAR, '0px');
    return;
  }

  const lvhPx = probe100lvh();
  const bleed = Math.max(0, Math.round(outerHeight - lvhPx));
  root.style.setProperty(VP_CHROME_BLEED_VAR, `${bleed}px`);
}
