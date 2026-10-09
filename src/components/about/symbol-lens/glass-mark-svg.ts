/**
 * Glass mark matching the Figma frame (Glass Logo, node 1:87):
 * a translucent fill, a crisp white edge, and an inner glow that peaks
 * on the silhouette and falls off inward. The live gradient shows through.
 *
 * Render this inline. Rasterizing it through an <img> flattens the rim.
 */

import {SYMBOL_PATH_D, SYMBOL_VIEWBOX_H, SYMBOL_VIEWBOX_W} from './symbol-path';

/** ViewBox units of margin so the outer shadow is not clipped. */
export const GLASS_PAD_VB = 8;

export function buildGlassMarkSvg(): string {
  const pad = GLASS_PAD_VB;
  const vbW = SYMBOL_VIEWBOX_W + pad * 2;
  const vbH = SYMBOL_VIEWBOX_H + pad * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="${-pad} ${-pad} ${vbW} ${vbH}" fill="none" overflow="visible">
  <defs>
    <clipPath id="inside" clipPathUnits="userSpaceOnUse">
      <path d="${SYMBOL_PATH_D}" fill-rule="evenodd"/>
    </clipPath>
    <filter id="rimBlur" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="1.1"/>
    </filter>
  </defs>
  <path d="${SYMBOL_PATH_D}" fill="white" fill-opacity="0.14" fill-rule="evenodd"/>
  <g clip-path="url(#inside)">
    <g filter="url(#rimBlur)">
      <path d="${SYMBOL_PATH_D}" fill="none" stroke="white" stroke-opacity="0.22" stroke-width="14" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    </g>
  </g>
  <path d="${SYMBOL_PATH_D}" fill="none" fill-rule="evenodd" stroke="white" stroke-opacity="0.38" stroke-width="1" stroke-linejoin="miter" vector-effect="non-scaling-stroke"/>
</svg>`;
}
