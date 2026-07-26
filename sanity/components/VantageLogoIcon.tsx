/**
 * VantageLogoIcon — Studio workspace icon (navbar brand mark).
 *
 * Black tile + white mark so it stays visible on light Studio chrome.
 */

export function VantageLogoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 36"
      width="1em"
      height="1em"
      aria-hidden
    >
      <rect width="36" height="36" fill="#000" />
      <g transform="translate(3.6 3.6) scale(0.8)">
        <polygon
          fill="#fff"
          points="13.48 0 18.01 12.46 23.48 27.53 10.83 32.14 18.01 12.46 8.56 12.46 0 36 36 36 22.9 0 13.48 0"
        />
      </g>
    </svg>
  )
}
