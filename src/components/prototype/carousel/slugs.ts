/**
 * Hardcoded featured-work slugs for the /prototype/carousel route.
 *
 * Placeholder: first 9 entries from the current homepage featured-work
 * gallery (WP vp/portfolio-gallery order). Swap this list when the
 * curated set is supplied — do not read homepage CMS order at runtime.
 */
export const PROTOTYPE_CAROUSEL_SLUGS = [
  'govee-halloween',
  'realme-15-series-5g-live-real-in-every-shot',
  'oneplus-pad-3-masterful-by-every-measure',
  'realme-c75-everything-proof',
  'banyan-tree-theres-more-to-discovery',
  'realme-13-5g-unleash-your-gaming-potential',
  'tpbank-chatpay',
  'bambu-lab-vortek',
  'oneplus-12-chasing-luna',
] as const;

export type PrototypeCarouselSlug = (typeof PROTOTYPE_CAROUSEL_SLUGS)[number];
