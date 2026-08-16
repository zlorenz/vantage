/**
 * Site typefaces via next/font (self-hosted at build time).
 *
 * Mona Sans is the body/UI face (Light 300 / Regular 400 / Medium 500 / Bold 700).
 * It includes a `vietnamese` subset, so no separate Vietnamese fallback
 * face is required. next/font exposes it as `--font-vp-body-raw`; the
 * @theme stack token is `--font-vp-sans` (face name, not the raw var).
 *
 * Special Gothic Expanded One is the display/heading face (Regular 400
 * only — no Bold/Italic files exist). next/font exposes it as
 * `--font-vp-heading-raw` so it does not collide with the @theme stack
 * token `--font-vp-heading`. It has no Vietnamese coverage, so Dela
 * Gothic One is loaded as `--font-vp-heading-fallback` and slotted
 * second in that stack (after the raw face, before system-ui).
 *
 * The heading @theme stack composes from the next/font CSS variables
 * (`--font-vp-heading-raw`, `--font-vp-heading-fallback`) with
 * `adjustFontFallback: false` so size-adjusted Arial is not baked in.
 * Body still uses the face name `"Mona Sans"` directly in `--font-vp-sans`
 * rather than `var(--font-vp-body-raw)`.
 *
 * Do not load these with a CSS @import: Tailwind/Lightning CSS strips
 * external @import urls from the compiled stylesheet, so the face never
 * loads and the browser falls back to system-ui.
 */

import {
  Dela_Gothic_One,
  Mona_Sans,
  Special_Gothic_Expanded_One,
} from 'next/font/google';

export const specialGothicExpandedOne = Special_Gothic_Expanded_One({
  subsets: ['latin', 'latin-ext'],
  weight: ['400'],
  variable: '--font-vp-heading-raw',
  display: 'swap',
  adjustFontFallback: false,
});

export const delaGothicOne = Dela_Gothic_One({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: '400',
  variable: '--font-vp-heading-fallback',
  display: 'swap',
  adjustFontFallback: false,
});

export const monaSans = Mona_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-vp-body-raw',
  display: 'swap',
  adjustFontFallback: false,
});
