/**
 * Site typefaces via next/font (self-hosted at build time).
 *
 * Poppins is primary but has no Vietnamese glyphs (latin + latin-ext only).
 * Nunito is the Vietnamese fallback: geometric/rounded like Poppins, full
 * weight range, and a `vietnamese` subset.
 *
 * The site font stack in globals.css uses the face names `Poppins, Nunito, …`
 * directly. Do not compose from `var(--font-poppins)` — next/font’s size-
 * adjusted fallback is `local(Arial)` baked into that variable, and Arial
 * supplies Vietnamese glyphs before Nunito can (thin/tall under text-stroke).
 *
 * `adjustFontFallback: false` avoids emitting that Arial face when the
 * toolchain respects it; the CSS stack bypass is the reliable guard.
 *
 * Do not load these with a CSS @import: Tailwind/Lightning CSS strips
 * external @import urls from the compiled stylesheet, so the face never
 * loads and the browser falls back to system-ui (much thinner at weight 300).
 */

import { Nunito, Poppins } from 'next/font/google';

export const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
  adjustFontFallback: false,
});

export const nunito = Nunito({
  subsets: ['vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
  adjustFontFallback: false,
});
