/**
 * Shared Media-library helpers for campaign-brief (non-editorial) uploads.
 *
 * Attachments are tagged `external-upload` (optional manual filter in
 * sanity-plugin-media) and labeled via asset `creditLine` (shown in the
 * plugin's Credit field when creditLine.enabled is on).
 */

import type {SanityClient} from '@sanity/client'

/** Deterministic document id — stable GROQ `references("…")` filters. */
export const EXTERNAL_UPLOAD_TAG_ID = 'mediaTag-external-upload'

/**
 * Display label in sanity-plugin-media's Tags sidebar (`media.tag.name.current`).
 * Tagging / GROQ filters use {@link EXTERNAL_UPLOAD_TAG_ID}, not this string.
 */
export const EXTERNAL_UPLOAD_TAG_NAME = 'Client Upload (Campaign Brief)'

/** Surfaced in sanity-plugin-media's asset detail "Credit" field. */
export const EXTERNAL_UPLOAD_CREDIT_LINE =
  'Campaign brief upload — auto-deletes after 30 days'

/**
 * GROQ filter for assets that are not external-upload tagged.
 * Kept for optional tooling / Structure filters; the shared Media plugin
 * grid shows all assets and relies on the tag facet + creditLine label.
 */
export const EDITORIAL_ASSETS_GROQ_FILTER =
  `_type in ["sanity.imageAsset", "sanity.fileAsset"]` +
  ` && !(_id in path("drafts.**"))` +
  ` && !references("${EXTERNAL_UPLOAD_TAG_ID}")`

/** Unfiltered asset list. */
export const ALL_ASSETS_GROQ_FILTER =
  `_type in ["sanity.imageAsset", "sanity.fileAsset"]` + ` && !(_id in path("drafts.**"))`

export async function ensureExternalUploadTag(client: SanityClient): Promise<string> {
  await client.createIfNotExists({
    _id: EXTERNAL_UPLOAD_TAG_ID,
    _type: 'media.tag',
    name: {
      _type: 'slug',
      current: EXTERNAL_UPLOAD_TAG_NAME,
    },
  })
  // Keep display label in sync (createIfNotExists will not update an existing doc).
  await client
    .patch(EXTERNAL_UPLOAD_TAG_ID)
    .set({
      name: {
        _type: 'slug',
        current: EXTERNAL_UPLOAD_TAG_NAME,
      },
    })
    .commit()
  return EXTERNAL_UPLOAD_TAG_ID
}

/**
 * Append a weak media.tag ref at opt.media.tags (same shape as sanity-plugin-media).
 * Idempotent when the asset already references the tag.
 */
export async function tagAssetAsExternalUpload(
  client: SanityClient,
  assetId: string,
): Promise<void> {
  await ensureExternalUploadTag(client)

  const alreadyTagged = await client.fetch<boolean>(
    `count(*[_id == $assetId && references($tagId)]) > 0`,
    {assetId, tagId: EXTERNAL_UPLOAD_TAG_ID},
  )
  if (alreadyTagged) return

  const key = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 12) ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

  await client
    .patch(assetId)
    .setIfMissing({opt: {}})
    .setIfMissing({'opt.media': {}})
    .setIfMissing({'opt.media.tags': []})
    .append('opt.media.tags', [
      {
        _key: key,
        _type: 'reference',
        _ref: EXTERNAL_UPLOAD_TAG_ID,
        _weak: true,
      },
    ])
    .commit()
}

/** Set the Credit field used by sanity-plugin-media for visual recognition. */
export async function setExternalUploadCreditLine(
  client: SanityClient,
  assetId: string,
): Promise<void> {
  await client.patch(assetId).set({creditLine: EXTERNAL_UPLOAD_CREDIT_LINE}).commit()
}
