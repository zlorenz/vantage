/**
 * Safari 26 Liquid Glass — in-flow black bleed below the homepage carousel (A1).
 *
 * Bleed height is a fixed constant, not live-measured. Calibrated on real iPhone
 * hardware: screen.height − 100lvh ≈ 60px; direct screenshot inspection of the
 * toolbar band ≈ 58px CSS (174 physical px ÷ 3x DPR). We use 64px for a small
 * safety margin.
 *
 * syncVpChromeBleed() writes --vp-chrome-bleed on mount + orientationchange.
 * That hook is harmless with a constant but kept so a future Safari build can
 * swap back to dynamic measurement without changing consumers. Never wire to
 * visualViewport resize.
 */

const VP_CHROME_BLEED_VAR = '--vp-chrome-bleed';

/** Calibrated fixed bleed height in CSS pixels. */
const VP_CHROME_BLEED_PX = 64;

/** Set --vp-chrome-bleed on :root (fixed 64px; see module comment). */
export function syncVpChromeBleed(): void {
  if (typeof document === 'undefined') return;

  document.documentElement.style.setProperty(
    VP_CHROME_BLEED_VAR,
    `${VP_CHROME_BLEED_PX}px`,
  );
}
