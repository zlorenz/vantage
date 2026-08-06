/**
 * Site typefaces via next/font (self-hosted at build time).
 *
 * Mona Sans is the body/UI face (Light 300 / Regular 400 / Bold 700).
 * It includes a `vietnamese` subset, so no separate Vietnamese fallback
 * face is required.
 *
 * Special Gothic Expanded One is the display/heading face (Regular 400
 * only — no Bold/Italic files exist). It has no Vietnamese coverage, so
 * Dela Gothic One is loaded as `--font-vp-heading-fallback` and slotted
 * second in the heading stack (after Special Gothic, before system-ui)
 * for Vietnamese diacritic glyphs.
 *
 * The site font stacks in globals.css use the face names
 * `"Mona Sans"` / `"Special Gothic Expanded One"` directly. Do not
 * compose from `var(--font-vp-body-raw)` / `var(--font-vp-heading)` —
 * next/font’s size-adjusted fallback is `local(Arial)` baked into those
 * variables, and Arial can supply glyphs before the intended face
 * (and looks thin/tall under text-stroke). The heading Vietnamese
 * fallback is the intentional exception: `var(--font-vp-heading-fallback)`
 * is composed into the stack with `adjustFontFallback: false`.
 *
 * `adjustFontFallback: false` avoids emitting that Arial face when the
 * toolchain respects it; the CSS stack bypass is the reliable guard.
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
  variable: '--font-vp-heading',
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
  weight: ['300', '400', '700'],
  variable: '--font-vp-body-raw',
  display: 'swap',
  adjustFontFallback: false,
});
