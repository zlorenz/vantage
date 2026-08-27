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

/** Deterministic id for portfolio Key Visuals stills (`portfolioEntry.keyVisuals`). */
export const KEY_VISUAL_TAG_ID = 'mediaTag-key-visual'

/**
 * Display label in sanity-plugin-media's Tags sidebar (`media.tag.name.current`).
 * Tagging / GROQ filters use {@link EXTERNAL_UPLOAD_TAG_ID}, not this string.
 */
export const EXTERNAL_UPLOAD_TAG_NAME = 'Client Upload (Campaign Brief)'

/**
 * Display label for Key Visuals assets. {@link AutoTagInput} resolves tags by this
 * name; {@link ensureKeyVisualTag} creates the doc at {@link KEY_VISUAL_TAG_ID}.
 */
export const KEY_VISUAL_TAG_NAME = 'Key Visual'

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

async function ensureMediaTag(
  client: SanityClient,
  tagId: string,
  tagName: string,
): Promise<string> {
  await client.createIfNotExists({
    _id: tagId,
    _type: 'media.tag',
    name: {
      _type: 'slug',
      current: tagName,
    },
  })
  // Keep display label in sync (createIfNotExists will not update an existing doc).
  await client
    .patch(tagId)
    .set({
      name: {
        _type: 'slug',
        current: tagName,
      },
    })
    .commit()
  return tagId
}

export async function ensureExternalUploadTag(client: SanityClient): Promise<string> {
  return ensureMediaTag(client, EXTERNAL_UPLOAD_TAG_ID, EXTERNAL_UPLOAD_TAG_NAME)
}

export async function ensureKeyVisualTag(client: SanityClient): Promise<string> {
  return ensureMediaTag(client, KEY_VISUAL_TAG_ID, KEY_VISUAL_TAG_NAME)
}

/**
 * Append a weak media.tag ref at opt.media.tags (same shape as sanity-plugin-media).
 * Idempotent when the asset already references the tag.
 */
async function tagAssetWithMediaTag(
  client: SanityClient,
  assetId: string,
  tagId: string,
): Promise<void> {
  const alreadyTagged = await client.fetch<boolean>(
    `count(*[_id == $assetId && references($tagId)]) > 0`,
    {assetId, tagId},
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
        _ref: tagId,
        _weak: true,
      },
    ])
    .commit()
}

export async function tagAssetAsExternalUpload(
  client: SanityClient,
  assetId: string,
): Promise<void> {
  await ensureExternalUploadTag(client)
  await tagAssetWithMediaTag(client, assetId, EXTERNAL_UPLOAD_TAG_ID)
}

export async function tagAssetAsKeyVisual(
  client: SanityClient,
  assetId: string,
): Promise<void> {
  await ensureKeyVisualTag(client)
  await tagAssetWithMediaTag(client, assetId, KEY_VISUAL_TAG_ID)
}

/** Set the Credit field used by sanity-plugin-media for visual recognition. */
export async function setExternalUploadCreditLine(
  client: SanityClient,
  assetId: string,
): Promise<void> {
  await client.patch(assetId).set({creditLine: EXTERNAL_UPLOAD_CREDIT_LINE}).commit()
}
