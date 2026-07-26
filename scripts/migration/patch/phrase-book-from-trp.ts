/**
 * Sync Sanity phrase book + document ZH fields to local WP TranslatePress.
 *
 * Dry-run by default:
 *   npm run migrate:patch:phrase-book-from-trp
 *   npm run migrate:patch:phrase-book-from-trp -- --apply
 *
 * Does NOT re-harvest from Sanity (that would re-copy wrong pairs).
 */

import fs from 'node:fs'
import path from 'node:path'

import {FIELD_MAPS} from '../../../shared/ai-translation/field-map'
import {getAtPath} from '../../../shared/ai-translation/paths'
import {
  normalizePhraseKey,
  phraseDocumentId,
  PHRASE_UPSERT_MAX_EN_LENGTH,
} from '../../../shared/phrase-book'
import {closePool} from '../db'
import {getWriteClient} from '../lib/sanity-client'
import {
  cleanTrpArtifacts,
  normalizeLookupKey,
  normalizeWhitespace,
} from '../lib/translation-text'
import {loadDictionary} from '../lib/translatepress'
import '../config'

const APPLY = process.argv.includes('--apply')

const REPORT_PATH = path.join(
  process.cwd(),
  'scripts/migration/data/phrase-book-from-trp-report.json',
)

type TrpHit = {zh: string; mode: 'exact' | 'normalized'}

type PhrasePlan = {
  id: string
  en: string
  from: string
  to: string
  action: 'create' | 'update'
}

type DocFieldPlan = {
  docId: string
  type: string
  zhPath: string
  en: string
  from: string
  to: string
}

function zhEqual(a: string, b: string): boolean {
  return normalizeLookupKey(a) === normalizeLookupKey(b)
}

function buildNormIndex(dict: Map<string, string>): Map<string, string> {
  const index = new Map<string, string>()
  for (const [orig, translated] of dict) {
    const zh = normalizeWhitespace(cleanTrpArtifacts(translated))
    if (!zh) continue
    const key = normalizeLookupKey(orig)
    if (!key) continue
    const prev = index.get(key)
    if (
      !prev ||
      (zhEqual(prev, key) && !zhEqual(zh, key)) ||
      zh.length > prev.length
    ) {
      index.set(key, zh)
    }
  }
  return index
}

/** Resolve a usable TRP translation (must be distinct from EN). */
function lookupTrp(
  en: string,
  dict: Map<string, string>,
  normIndex: Map<string, string>,
): TrpHit | null {
  const exact = dict.get(en)
  if (exact?.trim()) {
    const zh = normalizeWhitespace(cleanTrpArtifacts(exact))
    if (zh && !zhEqual(zh, en)) return {zh, mode: 'exact'}
  }
  const normHit = normIndex.get(normalizeLookupKey(en))
  if (normHit && !zhEqual(normHit, en)) {
    return {zh: normHit, mode: 'normalized'}
  }
  return null
}

function isSlugPath(p: string): boolean {
  return p.includes('slug')
}

function collectDocPlans(
  doc: Record<string, unknown>,
  dict: Map<string, string>,
  normIndex: Map<string, string>,
  out: DocFieldPlan[],
): void {
  const type = String(doc._type)
  const docId = String(doc._id)

  if (type === 'creditIdentity') {
    // Skip — TRP often phonetically "translates" crew/brand names poorly.
    return
  }

  const maps = FIELD_MAPS[type as keyof typeof FIELD_MAPS]
  if (!maps) return

  for (const mapping of maps) {
    if (mapping.kind !== 'plain') continue
    if (!mapping.enPath || !mapping.zhPath) continue
    if (isSlugPath(mapping.enPath) || isSlugPath(mapping.zhPath)) continue

    if (mapping.enPath.includes('[]')) {
      const [arrPath, ...rest] = mapping.enPath.split('[]')
      const enField = rest.join('[]').replace(/^\./, '')
      const zhField = mapping.zhPath.split('[]').slice(1).join('[]').replace(/^\./, '')
      const arrKey = arrPath.replace(/\.$/, '')
      const arr = getAtPath(doc, arrKey) as unknown
      if (!Array.isArray(arr)) continue
      for (const [index, item] of arr.entries()) {
        if (!item || typeof item !== 'object') continue
        const en = normalizePhraseKey(
          String((item as Record<string, unknown>)[enField] ?? ''),
        )
        if (!en || en.includes('<')) continue
        const hit = lookupTrp(en, dict, normIndex)
        if (!hit) continue
        const from = normalizePhraseKey(
          String((item as Record<string, unknown>)[zhField] ?? ''),
        )
        if (zhEqual(from, hit.zh)) continue
        out.push({
          docId,
          type,
          zhPath: `${arrKey}[${index}].${zhField}`,
          en,
          from,
          to: hit.zh,
        })
      }
      continue
    }

    planField(
      doc,
      docId,
      type,
      mapping.enPath,
      mapping.zhPath,
      dict,
      normIndex,
      out,
    )
  }
}

function planField(
  doc: Record<string, unknown>,
  docId: string,
  type: string,
  enPath: string,
  zhPath: string,
  dict: Map<string, string>,
  normIndex: Map<string, string>,
  out: DocFieldPlan[],
): void {
  const en = normalizePhraseKey(String(getAtPath(doc, enPath) ?? ''))
  if (!en || en.includes('<')) return
  const hit = lookupTrp(en, dict, normIndex)
  if (!hit) return
  const from = normalizePhraseKey(String(getAtPath(doc, zhPath) ?? ''))
  if (zhEqual(from, hit.zh)) return
  out.push({docId, type, zhPath, en, from, to: hit.zh})
}

async function main() {
  const dict = await loadDictionary()
  const normIndex = buildNormIndex(dict)
  const client = getWriteClient()

  const phrases = await client.fetch<
    Array<{_id: string; en?: string; zh?: string}>
  >(`*[_type == "translatedPhrase"]{_id, en, zh}`)

  const phraseByEn = new Map<string, {_id: string; zh: string}>()
  for (const p of phrases) {
    const en = normalizePhraseKey(p.en)
    const zh = normalizePhraseKey(p.zh)
    if (!en) continue
    phraseByEn.set(en, {_id: p._id, zh})
  }

  const phrasePlans: PhrasePlan[] = []

  // 1) Fix existing phrase-book rows that disagree with TRP
  for (const [en, row] of phraseByEn) {
    if (en.includes('<')) continue
    const hit = lookupTrp(en, dict, normIndex)
    if (!hit) continue
    if (zhEqual(row.zh, hit.zh)) continue
    phrasePlans.push({
      id: row._id,
      en,
      from: row.zh,
      to: hit.zh,
      action: 'update',
    })
  }

  // 2) Document field plans (+ create missing phrase rows for short keys)
  const docs = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type in [
      "portfolioEntry","blogPost","page","industry","market","videoFormat","category","siteSettings","creditIdentity"
    ] && !defined(trash.trashedAt)]{
      _id, _type, title, titleZh, name, nameZh,
      displayTitleParts,
      excerpt, excerptZh, description, descriptionZh,
      heroTitle, heroTitleZh,
      additionalVideos[]{_key, videoTitle, videoTitleZh, longTitle, longTitleZh, description, descriptionZh},
      founders[]{_key, jobTitle, jobTitleZh},
      seo,
      contactAddress, contactAddressZh,
      contactModalTitle, contactModalTitleZh,
      contactModalIntro, contactModalIntroZh,
      contactCtaText, contactCtaTextZh
    }`,
  )

  const docPlans: DocFieldPlan[] = []
  for (const doc of docs) {
    collectDocPlans(doc, dict, normIndex, docPlans)
  }

  // Ensure phrase book has TRP value for every short EN we are patching on docs
  const seenCreate = new Set(phrasePlans.map((p) => p.en))
  for (const plan of docPlans) {
    if (plan.en.length > PHRASE_UPSERT_MAX_EN_LENGTH) continue
    if (seenCreate.has(plan.en)) continue
    const existing = phraseByEn.get(plan.en)
    if (existing) {
      if (!zhEqual(existing.zh, plan.to)) {
        // already queued as update above, or race — ensure update
        if (!phrasePlans.some((p) => p.en === plan.en)) {
          phrasePlans.push({
            id: existing._id,
            en: plan.en,
            from: existing.zh,
            to: plan.to,
            action: 'update',
          })
          seenCreate.add(plan.en)
        }
      }
      continue
    }
    phrasePlans.push({
      id: phraseDocumentId(plan.en),
      en: plan.en,
      from: '',
      to: plan.to,
      action: 'create',
    })
    seenCreate.add(plan.en)
  }

  // Group doc plans by document for batched patches
  const byDoc = new Map<string, DocFieldPlan[]>()
  for (const plan of docPlans) {
    const list = byDoc.get(plan.docId) ?? []
    list.push(plan)
    byDoc.set(plan.docId, list)
  }

  const report = {
    generatedAt: new Date().toISOString(),
    apply: APPLY,
    trpDictionarySize: dict.size,
    phrase: {
      updates: phrasePlans.filter((p) => p.action === 'update').length,
      creates: phrasePlans.filter((p) => p.action === 'create').length,
      sample: phrasePlans.slice(0, 40),
    },
    documents: {
      fieldChanges: docPlans.length,
      docsTouched: byDoc.size,
      sample: docPlans.slice(0, 40),
    },
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), {recursive: true})
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

  console.log(`TRP dictionary: ${dict.size}`)
  console.log(
    `Phrase book: ${report.phrase.updates} updates, ${report.phrase.creates} creates`,
  )
  console.log(
    `Documents: ${docPlans.length} field changes across ${byDoc.size} docs`,
  )
  console.log(`Report: ${REPORT_PATH}`)

  if (!APPLY) {
    console.log('Dry-run only. Re-run with --apply to write.')
    await closePool()
    return
  }

  let phraseDone = 0
  for (const plan of phrasePlans) {
    await client.createOrReplace({
      _id: plan.id,
      _type: 'translatedPhrase',
      en: plan.en,
      zh: plan.to,
    })
    phraseDone += 1
    if (phraseDone % 25 === 0) console.log(`Phrases ${phraseDone}/${phrasePlans.length}…`)
  }
  console.log(`Phrases done: ${phraseDone}`)

  let docsDone = 0
  for (const [docId, plans] of byDoc) {
    const set: Record<string, string> = {}
    for (const plan of plans) set[plan.zhPath] = plan.to
    await client.patch(docId).set(set).commit({autoGenerateArrayKeys: true})
    docsDone += 1
    if (docsDone % 25 === 0) console.log(`Docs ${docsDone}/${byDoc.size}…`)
  }
  console.log(`Docs done: ${docsDone}`)
  console.log('Apply complete.')

  await closePool()
}

main().catch(async (err) => {
  console.error(err)
  await closePool().catch(() => {})
  process.exit(1)
})
