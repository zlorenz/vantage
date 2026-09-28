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

export function BriefUploadIcon() {
  return (
    <svg className="vp-form-dropzone-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <g transform="translate(0 -0.5)">
        <path
          fill="currentColor"
          d="M7 10.5H9.62171L10.0285 9.64364C10.9129 7.78198 12.8082 6.5 15 6.5C18.0376 6.5 20.5 8.96243 20.5 12C20.5 14.332 19.0487 16.325 17 17.1251V18.7101C19.8915 17.8496 22 15.171 22 12C22 8.13401 18.866 5 15 5C12.2076 5 9.7971 6.63505 8.67363 9H7C4.23858 9 2 11.2386 2 14C2 16.7614 4.23858 19 7 19V17.5C5.067 17.5 3.5 15.933 3.5 14C3.5 12.067 5.067 10.5 7 10.5Z"
        />
        <path
          fill="currentColor"
          d="M9.53033 17.5303L8.46967 16.4697L12 12.9393L15.5303 16.4697L14.4697 17.5303L12.75 15.8107V20H11.25V15.8107L9.53033 17.5303Z"
        />
      </g>
    </svg>
  );
}

export function BriefCalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="currentColor" d="M13.5 7.5H4.5V6H13.5V7.5Z" />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4.5 3V1.5H6V3H12V1.5H13.5V3H16.5V16.5H1.5V3H4.5ZM3 4.5V15H15V4.5H3Z"
      />
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
