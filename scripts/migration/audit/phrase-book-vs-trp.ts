/**
 * Align Sanity phrase book + document EN/ZH pairs against the local WP
 * TranslatePress dictionary (what powers the live /zh site).
 *
 * Usage: npm run migrate:audit:phrase-book-vs-trp
 * Output: scripts/migration/data/phrase-book-vs-trp.json
 */

import fs from 'node:fs'
import path from 'node:path'

import {FIELD_MAPS} from '../../../shared/ai-translation/field-map'
import {getAtPath} from '../../../shared/ai-translation/paths'
import {
  normalizePhraseKey,
  PHRASE_UPSERT_MAX_EN_LENGTH,
} from '../../../shared/phrase-book'
import {closePool} from '../db'
import {getWriteClient} from '../lib/sanity-client'
import {
  normalizeLookupKey,
  normalizeWhitespace,
} from '../lib/translation-text'
import {loadDictionary} from '../lib/translatepress'
import '../config'

const OUT_PATH = path.join(
  process.cwd(),
  'scripts/migration/data/phrase-book-vs-trp.json',
)

type PairHit = {
  en: string
  zh: string
  source: string
}

type AlignStatus =
  | 'match'
  | 'mismatch'
  | 'trp_missing'
  | 'identical_en_zh'
  | 'trp_same_as_en'

type AlignedRow = {
  en: string
  sanityZh: string
  trpZh?: string
  status: AlignStatus
  matchMode?: 'exact' | 'normalized' | 'enhanced'
  sources?: string[]
}

function collectFromValue(
  enPath: string,
  zhPath: string,
  doc: Record<string, unknown>,
  source: string,
  out: PairHit[],
): void {
  if (enPath.includes('[]')) {
    const [arrPath, ...rest] = enPath.split('[]')
    const enField = rest.join('[]').replace(/^\./, '')
    const zhField = zhPath.split('[]').slice(1).join('[]').replace(/^\./, '')
    const arr = getAtPath(doc, arrPath.replace(/\.$/, '')) as unknown
    if (!Array.isArray(arr)) return
    for (const [index, item] of arr.entries()) {
      if (!item || typeof item !== 'object') continue
      const en = normalizePhraseKey(
        String((item as Record<string, unknown>)[enField] ?? ''),
      )
      const zh = normalizePhraseKey(
        String((item as Record<string, unknown>)[zhField] ?? ''),
      )
      if (en && zh && en.length <= PHRASE_UPSERT_MAX_EN_LENGTH) {
        out.push({en, zh, source: `${source}[${index}].${enField}`})
      }
    }
    return
  }

  const en = normalizePhraseKey(String(getAtPath(doc, enPath) ?? ''))
  const zh = normalizePhraseKey(String(getAtPath(doc, zhPath) ?? ''))
  if (en && zh && en.length <= PHRASE_UPSERT_MAX_EN_LENGTH) {
    out.push({en, zh, source})
  }
}

function zhEqual(a: string, b: string): boolean {
  return normalizeLookupKey(a) === normalizeLookupKey(b)
}

/** One-pass normalized index: avoid O(n×m) scans over the TRP dictionary. */
function buildNormIndex(dict: Map<string, string>): Map<string, string> {
  const index = new Map<string, string>()
  for (const [orig, translated] of dict) {
    const zh = normalizeWhitespace(translated)
    if (!zh) continue
    const key = normalizeLookupKey(orig)
    if (!key) continue
    // Prefer longer / non-identical translations when collisions occur
    const prev = index.get(key)
    if (!prev || (zhEqual(prev, key) && !zhEqual(zh, key)) || zh.length > prev.length) {
      index.set(key, zh)
    }
  }
  return index
}

function alignAgainstTrp(
  en: string,
  sanityZh: string,
  dict: Map<string, string>,
  normIndex: Map<string, string>,
): Pick<AlignedRow, 'trpZh' | 'status' | 'matchMode'> {
  if (zhEqual(en, sanityZh)) {
    return {status: 'identical_en_zh'}
  }

  const exact = dict.get(en)
  if (exact?.trim()) {
    const trpZh = normalizeWhitespace(exact)
    if (zhEqual(trpZh, en)) return {trpZh, status: 'trp_same_as_en', matchMode: 'exact'}
    if (zhEqual(trpZh, sanityZh)) return {trpZh, status: 'match', matchMode: 'exact'}
    return {trpZh, status: 'mismatch', matchMode: 'exact'}
  }

  const normHit = normIndex.get(normalizeLookupKey(en))
  if (normHit) {
    if (zhEqual(normHit, en)) return {trpZh: normHit, status: 'trp_same_as_en', matchMode: 'normalized'}
    if (zhEqual(normHit, sanityZh)) return {trpZh: normHit, status: 'match', matchMode: 'normalized'}
    return {trpZh: normHit, status: 'mismatch', matchMode: 'normalized'}
  }

  // Skip enhanced HTML/segment lookup — phrase keys are plain text and the
  // enhanced path (JSDOM) OOMs when run against thousands of TRP rows.
  return {status: 'trp_missing'}
}

function tally(rows: AlignedRow[]): Record<AlignStatus, number> {
  const out: Record<AlignStatus, number> = {
    match: 0,
    mismatch: 0,
    trp_missing: 0,
    identical_en_zh: 0,
    trp_same_as_en: 0,
  }
  for (const row of rows) out[row.status] += 1
  return out
}

async function main() {
  const dict = await loadDictionary()
  const normIndex = buildNormIndex(dict)
  const client = getWriteClient()

  const phrases = await client.fetch<Array<{_id: string; en?: string; zh?: string}>>(
    `*[_type == "translatedPhrase"]{_id, en, zh}`,
  )

  const phraseRows: AlignedRow[] = []
  for (const p of phrases) {
    const en = normalizePhraseKey(p.en)
    const zh = normalizePhraseKey(p.zh)
    if (!en || !zh) continue
    const aligned = alignAgainstTrp(en, zh, dict, normIndex)
    phraseRows.push({en, sanityZh: zh, ...aligned, sources: [p._id]})
  }

  // Document-level pairs (same field set as harvest)
  const docs = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type in [
      "portfolioEntry","blogPost","page","industry","market","videoFormat","category","siteSettings","creditIdentity"
    ] && !defined(trash.trashedAt)]{
      _id, _type, title, titleZh, name, nameZh, slug, slugZh,
      displayTitleParts,
      excerpt, excerptZh, description, descriptionZh,
      heroTitle, heroTitleZh,
      additionalVideos[]{longTitle, longTitleZh, description, descriptionZh},
      founders[]{jobTitle, jobTitleZh},
      seo,
      contactAddress, contactAddressZh,
      contactModalTitle, contactModalTitleZh,
      contactModalIntro, contactModalIntroZh,
      contactCtaText, contactCtaTextZh
    }`,
  )

  const hits: PairHit[] = []
  for (const doc of docs) {
    const type = String(doc._type)
    const id = String(doc._id)
    if (type === 'creditIdentity') {
      collectFromValue('name', 'nameZh', doc, `creditIdentity:${id}`, hits)
      continue
    }
    const maps = FIELD_MAPS[type as keyof typeof FIELD_MAPS]
    if (!maps) continue
    for (const mapping of maps) {
      if (mapping.kind !== 'plain' || !mapping.enPath) continue
      collectFromValue(
        mapping.enPath,
        mapping.zhPath,
        doc,
        `${type}:${id}:${mapping.enPath}`,
        hits,
      )
    }
  }

  // Majority ZH per EN for document pairs
  const byEn = new Map<string, Map<string, {count: number; sources: string[]}>>()
  for (const hit of hits) {
    let zhMap = byEn.get(hit.en)
    if (!zhMap) {
      zhMap = new Map()
      byEn.set(hit.en, zhMap)
    }
    const row = zhMap.get(hit.zh) ?? {count: 0, sources: []}
    row.count += 1
    if (row.sources.length < 4) row.sources.push(hit.source)
    zhMap.set(hit.zh, row)
  }

  const docRows: AlignedRow[] = []
  const docConflicts: Array<{
    en: string
    variants: Array<{zh: string; count: number}>
    trpZh?: string
    trpAgreesWith?: string
  }> = []

  for (const [en, zhMap] of byEn) {
    const variants = [...zhMap.entries()]
      .map(([zh, meta]) => ({zh, count: meta.count, sources: meta.sources}))
      .sort((a, b) => b.count - a.count)
    const top = variants[0]!
    const aligned = alignAgainstTrp(en, top.zh, dict, normIndex)
    docRows.push({
      en,
      sanityZh: top.zh,
      ...aligned,
      sources: top.sources,
    })

    if (variants.length > 1) {
      let trpAgreesWith: string | undefined
      if (aligned.trpZh) {
        const hit = variants.find((v) => zhEqual(v.zh, aligned.trpZh!))
        if (hit) trpAgreesWith = hit.zh
      }
      docConflicts.push({
        en,
        variants: variants.map((v) => ({zh: v.zh, count: v.count})),
        trpZh: aligned.trpZh,
        trpAgreesWith,
      })
    }
  }

  const phraseTally = tally(phraseRows)
  const docTally = tally(docRows)

  const report = {
    generatedAt: new Date().toISOString(),
    trpDictionarySize: dict.size,
    phraseBook: {
      total: phraseRows.length,
      tally: phraseTally,
      matchRate:
        phraseRows.length === 0
          ? 0
          : Math.round((phraseTally.match / phraseRows.length) * 1000) / 10,
      mismatches: phraseRows
        .filter((r) => r.status === 'mismatch')
        .sort((a, b) => a.en.localeCompare(b.en)),
      trpMissing: phraseRows
        .filter((r) => r.status === 'trp_missing')
        .sort((a, b) => a.en.localeCompare(b.en)),
      identicalEnZh: phraseRows
        .filter((r) => r.status === 'identical_en_zh')
        .sort((a, b) => a.en.localeCompare(b.en)),
    },
    documentPairs: {
      hitCount: hits.length,
      uniqueEn: docRows.length,
      tally: docTally,
      matchRate:
        docRows.length === 0
          ? 0
          : Math.round((docTally.match / docRows.length) * 1000) / 10,
      mismatches: docRows
        .filter((r) => r.status === 'mismatch')
        .sort((a, b) => a.en.localeCompare(b.en)),
      trpMissing: docRows
        .filter((r) => r.status === 'trp_missing')
        .sort((a, b) => a.en.localeCompare(b.en)),
      conflicts: docConflicts.sort((a, b) => a.en.localeCompare(b.en)),
    },
  }

  fs.mkdirSync(path.dirname(OUT_PATH), {recursive: true})
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2))

  console.log(`TRP dictionary: ${dict.size}`)
  console.log(
    `Phrase book: ${phraseRows.length} — match ${phraseTally.match}, mismatch ${phraseTally.mismatch}, missing ${phraseTally.trp_missing}, identical ${phraseTally.identical_en_zh}`,
  )
  console.log(
    `Doc pairs: ${docRows.length} unique EN — match ${docTally.match}, mismatch ${docTally.mismatch}, missing ${docTally.trp_missing}, identical ${docTally.identical_en_zh}`,
  )
  console.log(`Conflicts with TRP tie-break: ${docConflicts.length}`)
  console.log(`Report: ${OUT_PATH}`)

  await closePool()
}

main().catch(async (err) => {
  console.error(err)
  await closePool().catch(() => {})
  process.exit(1)
})
