/**
 * Exact-string EN→ZH phrase book (whole-field match only).
 */

import {canonicalCrewRoleLabel} from '../crew-credits'

export {
  PHRASE_CATEGORIES,
  PHRASE_CATEGORY_PRIORITY,
  COMPANY_CREW_ROLE_KEYS,
  categoryForCmsField,
  isCompanyCrewRole,
  preferCategory,
  type PhraseCategoryId,
  type PhraseCategoryDef,
} from './categories'

export {
  classifyPhraseUsage,
  collectLiveEnHits,
  collectAllLiveEnHits,
  collectCatalogCrewRoleHits,
  liveEnSet,
  phraseContainsSpan,
  buildPhraseTableRows,
  creditLabelSeedPairs,
  seedPhraseDoc,
  PHRASE_INVENTORY_DOCS_QUERY,
  PHRASE_INVENTORY_PHRASES_QUERY,
  type LiveEnHit,
  type PhraseDocRow,
  type PhraseUsageReport,
  type UnusedPhraseRow,
  type PhraseTableRow,
  type PhraseUsageRef,
} from './inventory'

export {interfaceCodeRows, type InterfaceCodeRow} from './interface-messages'

/** Max EN length for Studio auto-upsert into the phrase book. */
export const PHRASE_UPSERT_MAX_EN_LENGTH = 80

export type PhraseRow = {
  en?: string | null
  zh?: string | null
}

export type PhraseMap = ReadonlyMap<string, string>

export function normalizePhraseKey(en: string | null | undefined): string {
  return (en ?? '').replace(/\s+/g, ' ').trim()
}

/** Deterministic Sanity document id for a phrase key. */
export function phraseDocumentId(en: string): string {
  const key = normalizePhraseKey(en)
  const slug = key
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  const hash = fnv1aHex(key)
  return `phrase.${slug || 'x'}.${hash}`
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function buildPhraseMap(rows: PhraseRow[] | null | undefined): PhraseMap {
  const map = new Map<string, string>()
  for (const row of rows ?? []) {
    const en = normalizePhraseKey(row.en)
    const zh = normalizePhraseKey(row.zh)
    if (!en || !zh) continue
    map.set(en, zh)
  }
  return map
}

export function phraseMapToRecord(map: PhraseMap): Record<string, string> {
  return Object.fromEntries(map)
}

export function phraseRecordToMap(
  record?: Record<string, string> | PhraseMap | null,
): PhraseMap {
  if (!record) return new Map()
  if (record instanceof Map) return record
  return new Map(Object.entries(record))
}

export function lookupPhrase(
  phrases: PhraseMap | null | undefined,
  en: string | null | undefined,
): string | undefined {
  if (!phrases?.size) return undefined
  const key = normalizePhraseKey(en)
  if (!key) return undefined
  const direct = phrases.get(key)
  if (direct) return direct
  const canonical = canonicalCrewRoleLabel(key)
  if (canonical !== key) return phrases.get(canonical)
  return undefined
}

export type ResolveLocalizedArgs = {
  locale: 'en' | 'zh'
  en: string | null | undefined
  zh?: string | null
  phrases?: PhraseMap | null
}

/**
 * Resolve a bilingual string for the active locale.
 * ZH order: phrase book → document Zh → English.
 */
export function resolveLocalizedString(args: ResolveLocalizedArgs): string {
  const en = args.en ?? ''
  if (args.locale !== 'zh') return en

  const fromBook = lookupPhrase(args.phrases, en)
  if (fromBook) return fromBook

  const fromDoc = normalizePhraseKey(args.zh)
  if (fromDoc) return fromDoc

  return en
}
