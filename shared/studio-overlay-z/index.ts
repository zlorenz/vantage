/**
 * Studio overlay elevation — Content tool / focus compose / Media asset source.
 *
 * Keep dependency-free so Sanity Vite + tsc can import cleanly.
 * Must stay above ambient FormBuilder layers inside the custom Content tool.
 */

/** Match BodyPortableTextInput focus overlay and ElevatedMediaAssetSource. */
export const STUDIO_OVERLAY_Z = 6000
