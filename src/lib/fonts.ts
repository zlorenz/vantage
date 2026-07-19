/**
 * Site typeface — Poppins via next/font (self-hosted at build time).
 *
 * Do not load Poppins with a CSS @import: Tailwind/Lightning CSS strips
 * external @import urls from the compiled stylesheet, so the face never
 * loads and the browser falls back to system-ui (much thinner at weight 300).
 */

import { Poppins } from 'next/font/google';

export const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});
