/**
 * Read-only: route non-people harvest candidates into phrase-book vs
 * document-field backfill buckets, classifying live Zh field state.
 *
 * Output: migration-data/wp-translation-audit/harvest-routing.json
 *
 * Usage: npx tsx scripts/migration/audit/harvest-routing.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from '@sanity/client'
import {config as loadEnv} from 'dotenv'

import {asPlainString, getAtPath} from '../../../shared/ai-translation/paths'
import {PATHS, SANITY} from '../config'
import {normalizeWhitespace} from '../lib/translation-text'

loadEnv({path: path.resolve(process.cwd(), '.env.local')})

const AUDIT_DIR = path.join(PATHS.migrationData, 'wp-translation-audit')
const TRIAGE_PATH = path.join(AUDIT_DIR, 'missing-strings-triage.json')
const OUT_PATH = path.join(AUDIT_DIR, 'harvest-routing.json')

const PHRASE_BOOK_DOMAINS = new Set([
  'default',
  'vantagepictures',
  'contact-form-7',
])

type HarvestRow = {
  en: string
  zh_wp: string
  source: string
  found_in: string
  match_kind: 'exact' | 'substring'
}

type DocFieldHit = {
  en: string
  zh_wp: string
  documentType: string
  documentId: string
  fieldName: string
  zhFieldName: string
  zh_sanity_current: string
}

function collapseWs(s: string): string {
  return normalizeWhitespace(s)
}

function zhEqual(a: string, b: string): boolean {
  return collapseWs(a) === collapseWs(b)
}

function enKey(s: string): string {
  return collapseWs(s).toLowerCase()
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

/**
 * Map found_in EN path → ZH field path (defineLocalePair: `${name}Zh`).
 * Returns null if no Zh counterpart exists for backfill.
 */
function zhFieldForFoundIn(found_in: string): string | null {
  const map: Record<string, string> = {
    'portfolioEntry.title': 'titleZh',
    'portfolioEntry.excerpt': 'excerptZh',
    'portfolioEntry.description': 'descriptionZh',
    'portfolioEntry.heroFilmTitle': 'heroFilmTitleZh',
    'portfolioEntry.seo.metaDescription': 'seo.metaDescriptionZh',
    'portfolioEntry.displayTitleParts.productName':
      'displayTitleParts.productNameZh',
    'portfolioEntry.additionalVideos[].videoTitle':
      'additionalVideos[].videoTitleZh',
    'portfolioEntry.additionalVideos[].description':
      'additionalVideos[].descriptionZh',
    'blogPost.title': 'titleZh',
    'blogPost.excerpt': 'excerptZh',
    'blogPost.seo.metaDescription': 'seo.metaDescriptionZh',
    'page.title': 'titleZh',
    'page.seo.metaDescription': 'seo.metaDescriptionZh',
    'industry.description': 'descriptionZh',
    'market.description': 'descriptionZh',
    'videoFormat.description': 'descriptionZh',
    // Intentionally unroutable for document Zh backfill:
    // blogPost.body / page.body — PT bodies; harvest hits are usually fragments
    // crewCredits[].role — EN-only; ZH via phrase book / catalog
    // client.name / platform.name — no Zh field
    // siteSettings.campaignCta.paragraphs[] — array; handled separately if exact
  }
  return map[found_in] ?? null
}

function parseDocType(found_in: string): string {
  return found_in.split('.')[0]!
}

function enPathFromFoundIn(found_in: string): string {
  // portfolioEntry.seo.metaDescription → seo.metaDescription
  // portfolioEntry.title → title
  const type = parseDocType(found_in)
  return found_in.slice(type.length + 1)
}

/** Collect {docId, enValue, zhValue, fieldName, zhFieldName} for a found_in path. */
function collectFieldPairs(
  doc: Record<string, unknown>,
  found_in: string,
  zhFieldPath: string,
): Array<{
  documentId: string
  fieldName: string
  zhFieldName: string
  enValue: string
  zhValue: string
}> {
  const type = String(doc._type ?? '')
  const id = String(doc._id ?? '').replace(/^drafts\./, '')
  const out: Array<{
    documentId: string
    fieldName: string
    zhFieldName: string
    enValue: string
    zhValue: string
  }> = []

  if (found_in.includes('additionalVideos[]')) {
    const videos = doc.additionalVideos
    if (!Array.isArray(videos)) return out
    const enKeyName = found_in.includes('videoTitle')
      ? 'videoTitle'
      : 'description'
    const zhKeyName = `${enKeyName}Zh`
    videos.forEach((row, i) => {
      if (!row || typeof row !== 'object') return
      const r = row as Record<string, unknown>
      out.push({
        documentId: id,
        fieldName: `${type}.additionalVideos[${i}].${enKeyName}`,
        zhFieldName: `${type}.additionalVideos[${i}].${zhKeyName}`,
        enValue: asPlainString(r[enKeyName]),
        zhValue: asPlainString(r[zhKeyName]),
      })
    })
    return out
  }

  const enPath = enPathFromFoundIn(found_in)
  const enValue = asPlainString(getAtPath(doc, enPath))
  const zhValue = asPlainString(getAtPath(doc, zhFieldPath))
  out.push({
    documentId: id,
    fieldName: `${type}.${enPath}`,
    zhFieldName: `${type}.${zhFieldPath}`,
    enValue,
    zhValue,
  })
  return out
}

async function main() {
  const triage = JSON.parse(fs.readFileSync(TRIAGE_PATH, 'utf8')) as {
    harvest: HarvestRow[]
  }

  const nonPeople = triage.harvest.filter(
    (h) => !h.found_in.includes('people'),
  )

  const phrase_book_candidate: Array<{en: string; zh_wp: string; source: string}> =
    []
  const dictionaryRows: HarvestRow[] = []
  const unrouted: Array<{en: string; zh_wp: string; source: string; reason: string}> =
    []

  for (const row of nonPeople) {
    if (row.source.startsWith('gettext:')) {
      const domain = row.source.slice('gettext:'.length)
      if (PHRASE_BOOK_DOMAINS.has(domain)) {
        phrase_book_candidate.push({
          en: row.en,
          zh_wp: row.zh_wp,
          source: row.source,
        })
      } else {
        unrouted.push({
          en: row.en,
          zh_wp: row.zh_wp,
          source: row.source,
          reason: `gettext domain not in phrase-book allowlist (${domain})`,
        })
      }
      continue
    }

    if (row.source === 'dictionary') {
      dictionaryRows.push(row)
      continue
    }

    unrouted.push({
      en: row.en,
      zh_wp: row.zh_wp,
      source: row.source,
      reason: 'unknown source',
    })
  }

  // Deduplicate phrase book by normalized EN (prefer first)
  const pbSeen = new Set<string>()
  const phraseBookDeduped: Array<{en: string; zh_wp: string}> = []
  for (const row of phrase_book_candidate) {
    const k = enKey(row.en)
    if (!k || pbSeen.has(k)) continue
    pbSeen.add(k)
    phraseBookDeduped.push({en: row.en, zh_wp: row.zh_wp})
  }

  const client = getReadClient()
  const docs = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type in [
      "portfolioEntry","blogPost","page","industry","market","videoFormat",
      "category","siteSettings","platform","client"
    ] && !defined(trash.trashedAt) && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
      _id, _type,
      title, titleZh, excerpt, excerptZh, description, descriptionZh,
      heroFilmTitle, heroFilmTitleZh, heroTitle, heroTitleZh,
      displayTitleParts,
      additionalVideos[]{videoTitle, videoTitleZh, description, descriptionZh},
      body, bodyZh,
      seo,
      name,
      campaignCta,
      crewCredits[]{role}
    }`,
  )

  // Index: docType + enPath template → list of field pairs
  const empty_safe_to_fill: Array<{
    en: string
    zh_wp: string
    documentType: string
    documentId: string
    fieldName: string
  }> = []
  const already_has_value_matches: Array<{
    en: string
    zh_wp: string
    documentType: string
    documentId: string
    fieldName: string
  }> = []
  const already_has_value_differs: Array<{
    en: string
    zh_wp: string
    zh_sanity_current: string
    documentType: string
    documentId: string
    fieldName: string
  }> = []

  const seenDocField = new Set<string>()

  for (const row of dictionaryRows) {
    const zhPath = zhFieldForFoundIn(row.found_in)
    if (!zhPath) {
      unrouted.push({
        en: row.en,
        zh_wp: row.zh_wp,
        source: row.source,
        reason: `no Zh backfill field for found_in=${row.found_in}`,
      })
      continue
    }

    const docType = parseDocType(row.found_in)
    const needle = enKey(row.en)
    if (!needle) continue

    let matchedAny = false
    for (const doc of docs) {
      if (String(doc._type) !== docType) continue
      const pairs = collectFieldPairs(doc, row.found_in, zhPath)
      for (const pair of pairs) {
        const enNorm = enKey(pair.enValue)
        if (!enNorm) continue

        // Prefer exact field equality; allow substring only when the harvest
        // said substring AND the needle is the full EN of a short field —
        // still require exact equality of the field value to the WP en for
        // safe document backfill (never fill from a body fragment).
        const exactField = enNorm === needle
        if (!exactField) continue

        matchedAny = true
        const dedupeKey = `${pair.documentId}|${pair.zhFieldName}|${needle}`
        if (seenDocField.has(dedupeKey)) continue
        seenDocField.add(dedupeKey)

        const hit: DocFieldHit = {
          en: row.en,
          zh_wp: row.zh_wp,
          documentType: docType,
          documentId: pair.documentId,
          fieldName: pair.fieldName,
          zhFieldName: pair.zhFieldName,
          zh_sanity_current: pair.zhValue,
        }

        const zhCurrent = collapseWs(pair.zhValue)
        if (!zhCurrent) {
          empty_safe_to_fill.push({
            en: hit.en,
            zh_wp: hit.zh_wp,
            documentType: hit.documentType,
            documentId: hit.documentId,
            fieldName: hit.fieldName,
          })
        } else if (zhEqual(pair.zhValue, row.zh_wp)) {
          already_has_value_matches.push({
            en: hit.en,
            zh_wp: hit.zh_wp,
            documentType: hit.documentType,
            documentId: hit.documentId,
            fieldName: hit.fieldName,
          })
        } else {
          already_has_value_differs.push({
            en: hit.en,
            zh_wp: hit.zh_wp,
            zh_sanity_current: pair.zhValue,
            documentType: hit.documentType,
            documentId: hit.documentId,
            fieldName: hit.fieldName,
          })
        }
      }
    }

    if (!matchedAny) {
      unrouted.push({
        en: row.en,
        zh_wp: row.zh_wp,
        source: row.source,
        reason: `dictionary harvest found_in=${row.found_in} but no live doc field exactly equals EN (likely substring-only / stale)`,
      })
    }
  }

  // Sort for stable review
  const byEn = <T extends {en: string}>(a: T, b: T) =>
    a.en.localeCompare(b.en, 'en')
  phraseBookDeduped.sort(byEn)
  empty_safe_to_fill.sort(byEn)
  already_has_value_matches.sort(byEn)
  already_has_value_differs.sort(byEn)

  const counts = {
    non_people_harvest_input: nonPeople.length,
    phrase_book_candidate: phraseBookDeduped.length,
    document_field_empty_safe_to_fill: empty_safe_to_fill.length,
    document_field_already_has_value_matches: already_has_value_matches.length,
    document_field_already_has_value_differs: already_has_value_differs.length,
    document_field_total:
      empty_safe_to_fill.length +
      already_has_value_matches.length +
      already_has_value_differs.length,
    unrouted: unrouted.length,
  }

  const output = {
    generated_at: new Date().toISOString(),
    notes: {
      phrase_book_domains: [...PHRASE_BOOK_DOMAINS],
      zh_naming: 'defineLocalePair → `${enName}Zh`; seo.metaDescriptionZh under seo object',
      document_match: 'exact EN field equality only (substring harvest hits without exact field match → unrouted)',
      people_names_excluded: true,
    },
    phrase_book_candidate: phraseBookDeduped,
    document_field_candidate: {
      empty_safe_to_fill,
      already_has_value_matches,
      already_has_value_differs,
    },
    unrouted,
    counts,
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8')

  const unroutedReasons: Record<string, number> = {}
  for (const u of unrouted) {
    const key = u.reason.split('(')[0]!.trim()
    unroutedReasons[key] = (unroutedReasons[key] ?? 0) + 1
  }

  console.log(
    JSON.stringify(
      {
        counts,
        unrouted_reason_breakdown: unroutedReasons,
        phrase_book_sample: phraseBookDeduped.slice(0, 10),
        empty_safe_sample: empty_safe_to_fill.slice(0, 10),
        matches_sample: already_has_value_matches.slice(0, 10),
        differs_sample: already_has_value_differs.slice(0, 10),
        output: OUT_PATH,
        file_size_bytes: fs.statSync(OUT_PATH).size,
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
