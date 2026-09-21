/**
 * Shared GROQ projections for Portable Text bodies.
 *
 * Image blocks need asset->altText / asset->description so the site can
 * fall back from optional per-block alt/caption overrides to Media metadata.
 * Nested images (pullQuote.headshot, imagePair.left/right) expand the same way.
 */

const IMAGE_ASSET_FIELDS = `{
  _id,
  _type,
  url,
  altText,
  description,
  metadata
}`

/** Expand image (and nested image) asset refs used inside a PT array. */
export const PORTABLE_TEXT_WITH_IMAGE_ASSETS = `[]{
  ...,
  asset->${IMAGE_ASSET_FIELDS},
  headshot{
    ...,
    asset->${IMAGE_ASSET_FIELDS}
  },
  left{
    ...,
    asset->${IMAGE_ASSET_FIELDS}
  },
  right{
    ...,
    asset->${IMAGE_ASSET_FIELDS}
  }
}`
