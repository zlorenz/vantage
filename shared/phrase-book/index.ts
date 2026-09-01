/**
 * Exact-string EN→ZH phrase book (whole-field match only).
 */

import {stegaClean} from '@sanity/client/stega'

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
  isPhraseBookStatusPath,
  zhSiblingPathFor,
  readZhSibling,
  statusCheckModeForUsages,
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

export {
  PHRASE_PROPAGATION_PATHS,
  PROPAGATION_DOC_TYPES,
  buildCandidateQuery,
  buildOldZhMatchClause,
  splitArrayPath,
  DISPLAY_TITLE_ZH_PATHS,
  type PhrasePropagationPath,
} from './propagation-paths'

export {
  planPhrasePropagation,
  computeTitleZhAfterPatches,
  groupPatchesByDoc,
  PROPAGATION_CHUNK_SIZE,
  type PropagationInput,
  type PropagationPatch,
  type PropagationSkip,
  type PropagationPlan,
} from './propagate'

/** Max EN length for Studio auto-upsert into the phrase book. */
export const PHRASE_UPSERT_MAX_EN_LENGTH = 80

export type PhraseRow = {
  en?: string | null
  zh?: string | null
}

export type PhraseMap = ReadonlyMap<string, string>

/**
 * Normalize a phrase KEY / comparison input.
 * stegaClean first so draft-mode U+FEFF is not treated as whitespace by `\s+`
 * (which would shred stega before Map lookup). NFC after stegaClean so NFD and
 * NFC forms of the same Vietnamese string share one Map key. No-op on published
 * (non-stega) ASCII strings aside from NFC idempotence.
 */
export function normalizePhraseKey(en: string | null | undefined): string {
  return stegaClean(en ?? '').normalize('NFC').replace(/\s+/g, ' ').trim()
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
 *
 * Display returns keep stega for click-to-edit overlays:
 * - EN locale → raw `en`
 * - phrase-book hit → map value (built from non-stega phrase docs)
 * - document Zh → raw `zh` (emptiness checked via normalizePhraseKey only)
 * - fallback → raw `en`
 * Lookup keys go through normalizePhraseKey (stegaClean + NFC + collapse).
 * Display returns are NFC-normalized so Vietnamese diacritics render as
 * precomposed glyphs (heading fallback subsets lack standalone U+0302/U+031B).
 */
export function resolveLocalizedString(args: ResolveLocalizedArgs): string {
  const en = args.en ?? ''
  if (args.locale !== 'zh') return en.normalize('NFC')

  const fromBook = lookupPhrase(args.phrases, en)
  if (fromBook) return fromBook.normalize('NFC')

  // Presence/emptiness via cleaned key; return RAW zh (then NFC) so draft
  // overlays survive. (normalizePhraseKey output must not be used as display —
  // it strips stega.)
  if (normalizePhraseKey(args.zh)) return (args.zh ?? '').normalize('NFC')

  return en.normalize('NFC')
}
