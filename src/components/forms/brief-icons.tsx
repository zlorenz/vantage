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
