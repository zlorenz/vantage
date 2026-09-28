/**
 * Filled glyphs for the campaign brief. Ink boxes match the visible
 * shape so centering the SVG centers the paint.
 */

/** Downward triangle. Visible ink of the Figma 18px chevron is 8 × 6.5. */
export function BriefCaretIcon() {
  return (
    <svg width="8" height="6.5" viewBox="0 0 8 6.5" aria-hidden="true">
      <path d="M0 0H8L4 6.5Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Figma check.1 path. Translated so the painted ink center sits on the
 * viewBox center, then scaled via width/height (20 in boxes, 24 on steps).
 */
export function BriefPreviousArrow() {
  return (
    <svg
      className="vp-brief-btn__arrow"
      width="16.971"
      height="16.971"
      viewBox="0 0 16.9706 16.9706"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M3.76056 15.64L1.33069 13.2101L10.5102 3.76061H1.0607L4.03055 1.0607H13.75L15.9099 3.22063V12.9401L13.21 15.9099V6.19048L3.76056 15.64Z"
      />
    </svg>
  );
}

/**
 * Figma check.1 path. Translated so the painted ink center sits on the
 * viewBox center, then scaled via width/height (20 in boxes, 24 on steps).
 */
export function BriefCheckIcon({ size }: { size: 20 | 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        transform="translate(-0.4165 -0.2945)"
        d="M17.256 6.42265L8.33339 15.3452L3.57747 10.5893L4.75598 9.41083L8.33339 12.9882L16.0774 5.24414L17.256 6.42265Z"
      />
    </svg>
  );
}
