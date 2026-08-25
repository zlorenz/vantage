/**
 * Migration-seed only — not used by any live carousel component.
 * Consumed by scripts/migration/patch/seed-home-redesign-carousel-slides.ts
 * to populate page.carouselSlides; runtime carousels read CMS order via
 * HOME_REDESIGN_CAROUSEL_QUERY / loadFeaturedWorkSlides instead.
 *
 * Hardcoded featured-work slugs (WP vp/portfolio-gallery order snapshot).
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
