/**
 * Read-only reconciliation: shared-UI WP TranslatePress strings vs Sanity
 * translatedPhrase (phrase book).
 *
 * Scope from full-translation-export.json:
 *   - all gettext_entries
 *   - dictionary_entries with empty linked_post_ids
 *
 * Output: migration-data/wp-translation-audit/phrase-book-reconciliation.json
 * Does not write to Sanity or WordPress.
 *
 * Usage: npx tsx scripts/migration/audit/phrase-book-reconciliation.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from '@sanity/client'

import {PHRASE_UPSERT_MAX_EN_LENGTH} from '../../../shared/phrase-book'
import {PATHS, SANITY} from '../config'
import {normalizeWhitespace} from '../lib/translation-text'

const EXPORT_PATH = path.join(
  PATHS.migrationData,
  'wp-translation-audit',
  'full-translation-export.json',
)
const OUT_PATH = path.join(
  PATHS.migrationData,
  'wp-translation-audit',
  'phrase-book-reconciliation.json',
)

type DictEntry = {
  original: string
  translated: string
  status: number
  linked_post_ids: number[]
}

type GettextEntry = {
  original: string
  translated: string
  status: number
  domain: string
}

type ExportFile = {
  dictionary_entries: DictEntry[]
  gettext_entries: GettextEntry[]
}

type WpScoped = {
  en: string
  zh: string
  status: number
  source: string
}

type MatchMode = 'exact' | 'normalized'

type ExactRow = {
  en: string
  zh_wp: string
  zh_sanity: string
  match_mode: MatchMode
  source: string
}

type MismatchRow = {
  en: string
  zh_wp: string
  zh_sanity: string
  match_mode: MatchMode
  source: string
}

type GapRow = {
  en: string
  zh_wp: string
  source: string
}

type SanityOnlyRow = {
  en: string
  zh_sanity: string
}

/** Trim + collapse whitespace (preserves case). */
function collapseWs(s: string): string {
  return normalizeWhitespace(s)
}

/** Case-insensitive EN key for matching across WP ↔ Sanity. */
function enMatchKey(s: string): string {
  return collapseWs(s).toLowerCase()
}

function zhEqual(a: string, b: string): boolean {
  return collapseWs(a) === collapseWs(b)
}

/**
 * Phrase-book candidate heuristic for missing vs unmatched split:
 * short enough for Studio upsert, no HTML, ZH distinct from EN.
 */
function isPhraseBookCandidate(en: string, zh: string): boolean {
  const enN = collapseWs(en)
  const zhN = collapseWs(zh)
  if (!enN || !zhN) return false
  if (enN.length > PHRASE_UPSERT_MAX_EN_LENGTH) return false
  if (/<[a-z][\s\S]*>/i.test(enN)) return false
  if (enMatchKey(enN) === enMatchKey(zhN)) return false
  return true
}

function getReadClient() {
  const token =
    process.env.SANITY_API_READ_TOKEN ||
    process.env.SANITY_API_WRITE_TOKEN ||
    process.env.SANITY_API_TOKEN ||
    SANITY.token ||
    ''
  return createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: token || undefined,
    useCdn: false,
  })
}

function collectScopedWp(data: ExportFile): WpScoped[] {
  const byKey = new Map<string, WpScoped>()

  const consider = (row: WpScoped) => {
    const key = enMatchKey(row.en)
    if (!key) return
    const prev = byKey.get(key)
    if (!prev) {
      byKey.set(key, row)
      return
    }
    // Prefer manual (status 2) over machine (1); else keep first.
    if (row.status === 2 && prev.status !== 2) {
      byKey.set(key, row)
    }
  }

  for (const g of data.gettext_entries) {
    consider({
      en: g.original,
      zh: g.translated,
      status: g.status,
      source: `gettext:${g.domain || 'unknown'}`,
    })
  }

  for (const d of data.dictionary_entries) {
    if (d.linked_post_ids?.length) continue
    consider({
      en: d.original,
      zh: d.translated,
      status: d.status,
      source: 'dictionary',
    })
  }

  return [...byKey.values()]
}

async function main() {
  const raw = fs.readFileSync(EXPORT_PATH, 'utf8')
  const exportData = JSON.parse(raw) as ExportFile
  const scoped = collectScopedWp(exportData)

  const client = getReadClient()
  const phrases = await client.fetch<Array<{en?: string; zh?: string}>>(
    `*[_type == "translatedPhrase" && !(_id in path("drafts.**"))]{en, zh}`,
  )

  // Sanity index by case-insensitive collapsed EN → {en, zh, collapseWs en}
  const sanityByKey = new Map<
    string,
    {en: string; zh: string; collapsedEn: string}
  >()
  for (const p of phrases) {
    const en = p.en ?? ''
    const zh = p.zh ?? ''
    const key = enMatchKey(en)
    if (!key || !collapseWs(zh)) continue
    // Prefer first; duplicates in phrase book are rare
    if (!sanityByKey.has(key)) {
      sanityByKey.set(key, {en, zh, collapsedEn: collapseWs(en)})
    }
  }

  const exact_match: ExactRow[] = []
  const mismatch: MismatchRow[] = []
  const missing_from_phrase_book: GapRow[] = []
  const unmatched_wp_string: GapRow[] = []
  const matchedSanityKeys = new Set<string>()

  for (const wp of scoped) {
    const key = enMatchKey(wp.en)
    const sanity = sanityByKey.get(key)
    if (!sanity) {
      const gap: GapRow = {
        en: wp.en,
        zh_wp: wp.zh,
        source: wp.source,
      }
      if (isPhraseBookCandidate(wp.en, wp.zh)) {
        missing_from_phrase_book.push(gap)
      } else {
        unmatched_wp_string.push(gap)
      }
      continue
    }

    matchedSanityKeys.add(key)
    const match_mode: MatchMode =
      collapseWs(wp.en) === sanity.collapsedEn ? 'exact' : 'normalized'

    if (zhEqual(wp.zh, sanity.zh)) {
      exact_match.push({
        en: wp.en,
        zh_wp: wp.zh,
        zh_sanity: sanity.zh,
        match_mode,
        source: wp.source,
      })
    } else {
      mismatch.push({
        en: wp.en,
        zh_wp: wp.zh,
        zh_sanity: sanity.zh,
        match_mode,
        source: wp.source,
      })
    }
  }

  const sanity_only_no_wp_match: SanityOnlyRow[] = []
  for (const [key, s] of sanityByKey) {
    if (matchedSanityKeys.has(key)) continue
    sanity_only_no_wp_match.push({en: s.en, zh_sanity: s.zh})
  }

  // Stable-ish sort for review
  const byEn = <T extends {en: string}>(a: T, b: T) =>
    a.en.localeCompare(b.en, 'en')
  exact_match.sort(byEn)
  mismatch.sort(byEn)
  missing_from_phrase_book.sort(byEn)
  unmatched_wp_string.sort(byEn)
  sanity_only_no_wp_match.sort(byEn)

  const counts = {
    exact_match: exact_match.length,
    mismatch: mismatch.length,
    missing_from_phrase_book: missing_from_phrase_book.length,
    unmatched_wp_string: unmatched_wp_string.length,
    sanity_only_no_wp_match: sanity_only_no_wp_match.length,
  }

  const output = {
    generated_at: new Date().toISOString(),
    scope: {
      gettext_entries: exportData.gettext_entries.length,
      dictionary_no_post: exportData.dictionary_entries.filter(
        (d) => !d.linked_post_ids?.length,
      ).length,
      unique_en_after_dedupe: scoped.length,
      sanity_translatedPhrase_docs: phrases.length,
      missing_vs_unmatched_heuristic:
        'missing = EN≤80 chars, no HTML, ZH≠EN; else unmatched',
    },
    exact_match,
    mismatch,
    missing_from_phrase_book,
    unmatched_wp_string,
    sanity_only_no_wp_match,
    counts,
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8')

  console.log(
    JSON.stringify(
      {
        counts,
        scope: output.scope,
        mismatch_sample: mismatch.slice(0, 10),
        missing_sample: missing_from_phrase_book.slice(0, 10),
        output_path: OUT_PATH,
        file_size_bytes: fs.statSync(OUT_PATH).size,
        match_mode_breakdown: {
          exact_match_exact: exact_match.filter((r) => r.match_mode === 'exact')
            .length,
          exact_match_normalized: exact_match.filter(
            (r) => r.match_mode === 'normalized',
          ).length,
          mismatch_exact: mismatch.filter((r) => r.match_mode === 'exact')
            .length,
          mismatch_normalized: mismatch.filter(
            (r) => r.match_mode === 'normalized',
          ).length,
        },
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
