/**
 * Shared helpers for the system-managed "Key Visual" videoFormat taxonomy value.
 *
 * Auto-applied to portfolioEntry.videoFormats[] when keyVisuals is non-empty
 * (see functions/key-visual-tag). Not manually assignable in Studio.
 */

import type {SanityClient} from '@sanity/client'

/** Deterministic document id — stable GROQ `references("…")` filters. */
export const KEY_VISUAL_VIDEO_FORMAT_ID = 'videoFormat-key-visual'

export const KEY_VISUAL_VIDEO_FORMAT_TITLE = 'Key Visual'

/**
 * PLACEHOLDER — needs Zach's real Chinese title in Studio before launch.
 * Do not treat as final copy.
 */
export const KEY_VISUAL_VIDEO_FORMAT_TITLE_ZH_PLACEHOLDER =
  '【待译】Key Visual'

export const KEY_VISUAL_VIDEO_FORMAT_SLUG = 'key-visual'

/**
 * PLACEHOLDER — needs Zach's real Chinese slug in Studio before launch.
 * Interim value mirrors the EN slug so /zh/视频格式/… resolves.
 */
export const KEY_VISUAL_VIDEO_FORMAT_SLUG_ZH_PLACEHOLDER = 'key-visual'

/** EN archive intro / meta — stills category, not generic "commercial video" copy. */
export const KEY_VISUAL_VIDEO_FORMAT_DESCRIPTION =
  'Still photography and key visuals from Vantage Pictures — campaign stills, product photography, and art-directed images produced alongside our commercial work in Vietnam.'

/**
 * PLACEHOLDER — needs Zach's real Chinese description in Studio before launch.
 * Do not treat as final copy.
 */
export const KEY_VISUAL_VIDEO_FORMAT_DESCRIPTION_ZH_PLACEHOLDER =
  '【待译】Still photography and key visuals from Vantage Pictures — campaign stills, product photography, and art-directed images produced alongside our commercial work in Vietnam.'

export function isKeyVisualVideoFormatId(id: string | null | undefined): boolean {
  if (!id) return false
  const bare = id.replace(/^drafts\./, '')
  return bare === KEY_VISUAL_VIDEO_FORMAT_ID
}

/**
 * Idempotent create of the Key Visual videoFormat document.
 * Does not overwrite Studio edits after first create (unlike media-tag name sync).
 */
export async function ensureKeyVisualVideoFormat(client: SanityClient): Promise<string> {
  await client.createIfNotExists({
    _id: KEY_VISUAL_VIDEO_FORMAT_ID,
    _type: 'videoFormat',
    title: KEY_VISUAL_VIDEO_FORMAT_TITLE,
    titleZh: KEY_VISUAL_VIDEO_FORMAT_TITLE_ZH_PLACEHOLDER,
    slug: {
      _type: 'slug',
      current: KEY_VISUAL_VIDEO_FORMAT_SLUG,
    },
    slugZh: {
      _type: 'slug',
      current: KEY_VISUAL_VIDEO_FORMAT_SLUG_ZH_PLACEHOLDER,
    },
    description: KEY_VISUAL_VIDEO_FORMAT_DESCRIPTION,
    descriptionZh: KEY_VISUAL_VIDEO_FORMAT_DESCRIPTION_ZH_PLACEHOLDER,
  })
  return KEY_VISUAL_VIDEO_FORMAT_ID
}

function newRefKey(): string {
  return (
    globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 12) ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  )
}

/**
 * Read videoFormats refs for a concrete document id (draft or published).
 * Uses getDocument — GROQ `*[…]` defaults to the published perspective and
 * silently misses `drafts.*` ids, which caused duplicate Key Visual refs.
 */
async function readVideoFormatRefs(
  client: SanityClient,
  portfolioEntryId: string,
): Promise<string[]> {
  const doc = await client.getDocument(portfolioEntryId)
  const formats = (
    doc as {videoFormats?: Array<{_ref?: string} | null> | null} | undefined
  )?.videoFormats
  if (!Array.isArray(formats)) return []
  return formats
    .map((item) => item?._ref)
    .filter((ref): ref is string => typeof ref === 'string' && ref.length > 0)
}

/** Append Key Visual format ref if missing. Idempotent. */
export async function addKeyVisualVideoFormatRef(
  client: SanityClient,
  portfolioEntryId: string,
): Promise<'added' | 'already-present'> {
  await ensureKeyVisualVideoFormat(client)

  const existing = await readVideoFormatRefs(client, portfolioEntryId)
  if (existing.some((ref) => isKeyVisualVideoFormatId(ref))) {
    return 'already-present'
  }

  await client
    .patch(portfolioEntryId)
    .setIfMissing({videoFormats: []})
    .append('videoFormats', [
      {
        _key: newRefKey(),
        _type: 'reference',
        _ref: KEY_VISUAL_VIDEO_FORMAT_ID,
      },
    ])
    .commit({autoGenerateArrayKeys: false})

  return 'added'
}

/** Remove only the Key Visual format ref(s). Leaves other formats untouched. */
export async function removeKeyVisualVideoFormatRef(
  client: SanityClient,
  portfolioEntryId: string,
): Promise<'removed' | 'absent'> {
  const existing = await readVideoFormatRefs(client, portfolioEntryId)
  if (!existing.some((ref) => isKeyVisualVideoFormatId(ref))) {
    return 'absent'
  }

  // Unset matches every array item with this _ref (clears accidental duplicates).
  await client
    .patch(portfolioEntryId)
    .unset([`videoFormats[_ref=="${KEY_VISUAL_VIDEO_FORMAT_ID}"]`])
    .commit()

  return 'removed'
}
