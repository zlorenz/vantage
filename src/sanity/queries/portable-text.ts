/**
 * Shared GROQ projections for Portable Text bodies.
 *
 * Image blocks need asset->altText / asset->description so the site can
 * fall back from optional per-block alt/caption overrides to Media metadata.
 */

/** Expand image (and any other) asset refs used inside a PT array. */
export const PORTABLE_TEXT_WITH_IMAGE_ASSETS = `[]{
  ...,
  asset->{
    _id,
    _type,
    url,
    altText,
    description,
    metadata
  }
}`
