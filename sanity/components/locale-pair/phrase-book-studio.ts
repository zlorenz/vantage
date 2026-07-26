/**
 * Studio helpers: look up / upsert exact EN→ZH phrases.
 */

import {
  normalizePhraseKey,
  phraseContainsSpan,
  phraseDocumentId,
  PHRASE_UPSERT_MAX_EN_LENGTH,
} from '@phrase-book'
import type {SanityClient} from 'sanity'

export type PhraseLookupResult = {
  zh: string
  phraseId: string
} | null

export async function lookupPhraseZh(
  client: SanityClient,
  enRaw: string,
): Promise<PhraseLookupResult> {
  const en = normalizePhraseKey(enRaw)
  if (!en) return null

  const row = await client.fetch<{_id: string; zh?: string} | null>(
    `*[_type == "translatedPhrase" && en == $en][0]{_id, zh}`,
    {en},
  )
  const zh = normalizePhraseKey(row?.zh)
  if (!zh || !row?._id) return null
  return {zh, phraseId: row._id.replace(/^drafts\./, '')}
}

export type UpsertPhraseResult =
  | {status: 'created'; id: string}
  | {status: 'unchanged'; id: string}
  | {status: 'conflict'; id: string; existingZh: string}
  | {
      status: 'skipped'
      reason: 'empty' | 'too-long' | 'same-as-en' | 'span'
    }

/**
 * Create a phrase if missing. Never overwrite a different ZH for the same EN.
 */
export async function upsertPhraseFromPair(
  client: SanityClient,
  enRaw: string,
  zhRaw: string,
): Promise<UpsertPhraseResult> {
  const en = normalizePhraseKey(enRaw)
  const zh = normalizePhraseKey(zhRaw)
  if (!en || !zh) return {status: 'skipped', reason: 'empty'}
  if (phraseContainsSpan(en)) return {status: 'skipped', reason: 'span'}
  if (en.length > PHRASE_UPSERT_MAX_EN_LENGTH) {
    return {status: 'skipped', reason: 'too-long'}
  }
  // Allow intentional Latin brands (Govee → Govee) to be stored; still upsert.

  const id = phraseDocumentId(en)
  const existing = await client.fetch<{_id: string; zh?: string} | null>(
    `*[_type == "translatedPhrase" && (en == $en || _id == $id || _id == $draftId)][0]{_id, zh}`,
    {en, id, draftId: `drafts.${id}`},
  )

  if (existing) {
    const existingZh = normalizePhraseKey(existing.zh)
    const existingId = existing._id.replace(/^drafts\./, '')
    if (existingZh === zh) return {status: 'unchanged', id: existingId}
    if (existingZh) return {status: 'conflict', id: existingId, existingZh}
  }

  await client.createOrReplace({
    _id: id,
    _type: 'translatedPhrase',
    en,
    zh,
  })
  return {status: 'created', id}
}

export type SavePhraseResult =
  | {status: 'saved'; id: string}
  | {status: 'cleared'; id: string}
  | {status: 'skipped'; reason: 'empty-en' | 'span'}

/**
 * Create or overwrite a phrase ZH (master Translations tool).
 * Empty ZH deletes the phrase document.
 */
export async function savePhraseZh(
  client: SanityClient,
  enRaw: string,
  zhRaw: string,
): Promise<SavePhraseResult> {
  const en = normalizePhraseKey(enRaw)
  if (!en) return {status: 'skipped', reason: 'empty-en'}
  if (phraseContainsSpan(en)) return {status: 'skipped', reason: 'span'}

  const id = phraseDocumentId(en)
  const zh = normalizePhraseKey(zhRaw)

  if (!zh) {
    try {
      await client.delete(id)
    } catch {
      // missing published
    }
    try {
      await client.delete(`drafts.${id}`)
    } catch {
      // missing draft
    }
    return {status: 'cleared', id}
  }

  await client.createOrReplace({
    _id: id,
    _type: 'translatedPhrase',
    en,
    zh,
  })
  return {status: 'saved', id}
}
