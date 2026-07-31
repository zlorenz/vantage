/**
 * Read-only refinement of phrase-book reconciliation:
 *   Part A — mismatch mechanical vs real triage
 *   Part B — missing/unmatched harvest vs discard (Sanity content presence)
 *
 * Outputs:
 *   migration-data/wp-translation-audit/mismatch-triage.json
 *   migration-data/wp-translation-audit/missing-strings-triage.json
 *
 * Does not write to Sanity or WordPress.
 *
 * Usage: npx tsx scripts/migration/audit/phrase-book-triage-refine.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import {createClient} from '@sanity/client'

import {asPlainString, getAtPath} from '../../../shared/ai-translation/paths'
import {phraseDocumentId} from '../../../shared/phrase-book'
import {PATHS, SANITY} from '../config'
import {normalizeWhitespace} from '../lib/translation-text'

const AUDIT_DIR = path.join(PATHS.migrationData, 'wp-translation-audit')
const RECON_PATH = path.join(AUDIT_DIR, 'phrase-book-reconciliation.json')
const MISMATCH_OUT = path.join(AUDIT_DIR, 'mismatch-triage.json')
const MISSING_OUT = path.join(AUDIT_DIR, 'missing-strings-triage.json')

const EXCLUDED_GETTEXT_DOMAINS = new Set([
  'wordpress-seo',
  'wordpress-seo-premium',
  'siteground_settings',
  'sg-cachepress',
  'sg-ai-studio',
  'wpvivid-backuprestore',
  'uixpress',
  'ninja-tables',
  'wp-bootstrap-blocks',
  'pheromone',
  'acf',
])

/** Min needle length for substring matches (shorter → exact field match only). */
const SUBSTRING_MIN_LEN = 3

type MismatchRow = {
  en: string
  zh_wp: string
  zh_sanity: string
  match_mode?: string
  source?: string
}

type GapRow = {
  en: string
  zh_wp: string
  source: string
}

type ReconFile = {
  mismatch: MismatchRow[]
  missing_from_phrase_book: GapRow[]
  unmatched_wp_string: GapRow[]
}

type FieldHit = {
  text: string
  found_in: string
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

function collapseWs(s: string): string {
  return normalizeWhitespace(s)
}

function enKey(s: string): string {
  return collapseWs(s).toLowerCase()
}

/** Strip trailing full/half-width periods + whitespace (TRP scan artifact). */
function stripTrailingPeriods(s: string): string {
  return collapseWs(s)
    .replace(/[。.．.]+$/u, '')
    .trim()
}

function stripHtml(s: string): string {
  return collapseWs(s.replace(/<[^>]+>/g, ' '))
}

function pushField(
  out: FieldHit[],
  textRaw: string,
  found_in: string,
): void {
  const text = collapseWs(textRaw)
  if (!text) return
  out.push({text, found_in})
}

function collectFieldsFromDoc(doc: Record<string, unknown>): FieldHit[] {
  const out: FieldHit[] = []
  const type = String(doc._type ?? '')
  const t = (field: string) => `${type}.${field}`

  const plainPaths = [
    'title',
    'excerpt',
    'description',
    'heroFilmTitle',
    'name',
    'contactAddress',
    'contactModalTitle',
    'contactModalIntro',
    'contactCtaText',
  ] as const

  for (const p of plainPaths) {
    pushField(out, asPlainString(getAtPath(doc, p)), t(p))
  }

  // HTML hero title
  const hero = asPlainString(getAtPath(doc, 'heroTitle'))
  if (hero) pushField(out, stripHtml(hero), t('heroTitle'))

  // Display title parts
  const parts = doc.displayTitleParts
  if (parts && typeof parts === 'object') {
    const p = parts as Record<string, unknown>
    for (const key of ['brandName', 'productName', 'campaignTitle'] as const) {
      pushField(out, asPlainString(p[key]), t(`displayTitleParts.${key}`))
    }
  }

  // SEO meta (EN only)
  const seo = doc.seo
  if (seo && typeof seo === 'object') {
    pushField(
      out,
      asPlainString((seo as Record<string, unknown>).metaDescription),
      t('seo.metaDescription'),
    )
  }

  // Portable Text bodies
  for (const ptField of ['body', 'contactModalContent'] as const) {
    const plain = asPlainString(getAtPath(doc, ptField))
    if (plain) pushField(out, plain, t(ptField))
  }

  // Array rows
  const videos = doc.additionalVideos
  if (Array.isArray(videos)) {
    videos.forEach((row, i) => {
      if (!row || typeof row !== 'object') return
      const r = row as Record<string, unknown>
      pushField(out, asPlainString(r.videoTitle), t(`additionalVideos[${i}].videoTitle`))
      pushField(out, asPlainString(r.description), t(`additionalVideos[${i}].description`))
    })
  }

  const founders = doc.founders
  if (Array.isArray(founders)) {
    founders.forEach((row, i) => {
      if (!row || typeof row !== 'object') return
      pushField(
        out,
        asPlainString((row as Record<string, unknown>).jobTitle),
        t(`founders[${i}].jobTitle`),
      )
    })
  }

  const credits = doc.crewCredits
  if (Array.isArray(credits)) {
    credits.forEach((row, i) => {
      if (!row || typeof row !== 'object') return
      const c = row as Record<string, unknown>
      pushField(out, asPlainString(c.role), t(`crewCredits[${i}].role`))
      const people = c.people
      if (Array.isArray(people)) {
        people.forEach((person, j) => {
          if (!person || typeof person !== 'object') return
          pushField(
            out,
            asPlainString((person as Record<string, unknown>).name),
            t(`crewCredits[${i}].people[${j}].name`),
          )
        })
      }
    })
  }

  // Campaign CTA object on siteSettings
  const cta = doc.campaignCta
  if (cta && typeof cta === 'object') {
    const c = cta as Record<string, unknown>
    if (typeof c.heading === 'string') {
      pushField(out, stripHtml(c.heading), t('campaignCta.heading'))
    }
    if (typeof c.buttonLabel === 'string') {
      pushField(out, asPlainString(c.buttonLabel), t('campaignCta.buttonLabel'))
    }
    if (Array.isArray(c.paragraphs)) {
      c.paragraphs.forEach((p, i) => {
        if (typeof p === 'string') {
          pushField(out, p, t(`campaignCta.paragraphs[${i}]`))
        }
      })
    }
  }

  return out
}

function parseGettextDomain(source: string): string | null {
  if (!source.startsWith('gettext:')) return null
  return source.slice('gettext:'.length)
}

async function partA(recon: ReconFile, phraseIdByEnKey: Map<string, string>) {
  const mechanical_only: Array<{
    en: string
    zh_wp: string
    zh_sanity: string
    source?: string
  }> = []
  const real_difference: Array<{
    en: string
    zh_wp: string
    zh_sanity: string
    translatedPhrase_id: string
    source?: string
  }> = []

  for (const row of recon.mismatch) {
    const wpNorm = stripTrailingPeriods(row.zh_wp)
    const sanityNorm = stripTrailingPeriods(row.zh_sanity)
    if (wpNorm === sanityNorm) {
      mechanical_only.push({
        en: row.en,
        zh_wp: row.zh_wp,
        zh_sanity: row.zh_sanity,
        source: row.source,
      })
      continue
    }
    const id =
      phraseIdByEnKey.get(enKey(row.en)) || phraseDocumentId(row.en)
    real_difference.push({
      en: row.en,
      zh_wp: row.zh_wp,
      zh_sanity: row.zh_sanity,
      translatedPhrase_id: id,
      source: row.source,
    })
  }

  const out = {
    generated_at: new Date().toISOString(),
    mechanical_only,
    real_difference,
    counts: {
      mechanical_only: mechanical_only.length,
      real_difference: real_difference.length,
    },
  }
  fs.writeFileSync(MISMATCH_OUT, JSON.stringify(out, null, 2), 'utf8')
  return out
}

async function partB(recon: ReconFile, fieldHits: FieldHit[]) {
  const combined = [
    ...recon.missing_from_phrase_book,
    ...recon.unmatched_wp_string,
  ]

  const domain_excluded: GapRow[] = []
  const remaining: GapRow[] = []
  for (const row of combined) {
    const domain = parseGettextDomain(row.source)
    if (domain && EXCLUDED_GETTEXT_DOMAINS.has(domain)) {
      domain_excluded.push(row)
    } else {
      remaining.push(row)
    }
  }

  // Exact index: normalized text → found_in locations
  const exactIndex = new Map<string, Set<string>>()
  for (const hit of fieldHits) {
    const key = enKey(hit.text)
    if (!key) continue
    let set = exactIndex.get(key)
    if (!set) {
      set = new Set()
      exactIndex.set(key, set)
    }
    set.add(hit.found_in)
  }

  // For substring search, keep unique texts with a representative found_in
  const uniqueTexts: Array<{key: string; found_in: string}> = []
  const seenText = new Set<string>()
  for (const hit of fieldHits) {
    const key = enKey(hit.text)
    if (!key || seenText.has(key)) continue
    seenText.add(key)
    uniqueTexts.push({key, found_in: hit.found_in})
  }

  const harvest: Array<{
    en: string
    zh_wp: string
    source: string
    found_in: string
    match_kind: 'exact' | 'substring'
  }> = []
  const discard_no_sanity_match: Array<{
    en: string
    zh_wp: string
    source: string
  }> = []

  for (const row of remaining) {
    const needle = enKey(row.en)
    if (!needle) {
      discard_no_sanity_match.push({
        en: row.en,
        zh_wp: row.zh_wp,
        source: row.source,
      })
      continue
    }

    const exactLocs = exactIndex.get(needle)
    if (exactLocs && exactLocs.size > 0) {
      harvest.push({
        en: row.en,
        zh_wp: row.zh_wp,
        source: row.source,
        found_in: [...exactLocs].sort()[0]!,
        match_kind: 'exact',
      })
      continue
    }

    // Substring only for needles long enough to avoid false positives
    let subHit: string | null = null
    if ([...needle].length >= SUBSTRING_MIN_LEN) {
      for (const t of uniqueTexts) {
        if (t.key.includes(needle)) {
          subHit = t.found_in
          break
        }
      }
    }

    if (subHit) {
      harvest.push({
        en: row.en,
        zh_wp: row.zh_wp,
        source: row.source,
        found_in: subHit,
        match_kind: 'substring',
      })
    } else {
      discard_no_sanity_match.push({
        en: row.en,
        zh_wp: row.zh_wp,
        source: row.source,
      })
    }
  }

  // Collapse found_in to documentType.fieldName (strip array indices for reporting)
  const normalizeFoundIn = (f: string) =>
    f.replace(/\[\d+\]/g, '[]')

  const harvestOut = harvest.map((h) => ({
    en: h.en,
    zh_wp: h.zh_wp,
    source: h.source,
    found_in: normalizeFoundIn(h.found_in),
    match_kind: h.match_kind,
  }))

  const out = {
    generated_at: new Date().toISOString(),
    domain_excluded_count: domain_excluded.length,
    excluded_domains: [...EXCLUDED_GETTEXT_DOMAINS].sort(),
    notes: {
      combined_pool: combined.length,
      substring_min_len: SUBSTRING_MIN_LEN,
      scanned_doc_types: [
        'portfolioEntry',
        'blogPost',
        'page',
        'industry',
        'market',
        'videoFormat',
        'category',
        'siteSettings',
        'platform',
        'client',
      ],
    },
    harvest: harvestOut,
    discard_no_sanity_match: discard_no_sanity_match.map((d) => ({
      en: d.en,
      zh_wp: d.zh_wp,
      source: d.source,
    })),
    counts: {
      domain_excluded: domain_excluded.length,
      harvest: harvestOut.length,
      discard_no_sanity_match: discard_no_sanity_match.length,
    },
  }

  fs.writeFileSync(MISSING_OUT, JSON.stringify(out, null, 2), 'utf8')
  return out
}

async function main() {
  const recon = JSON.parse(fs.readFileSync(RECON_PATH, 'utf8')) as ReconFile
  const client = getReadClient()

  const phrases = await client.fetch<Array<{_id: string; en?: string}>>(
    `*[_type == "translatedPhrase" && !(_id in path("drafts.**"))]{_id, en}`,
  )
  const phraseIdByEnKey = new Map<string, string>()
  for (const p of phrases) {
    const key = enKey(p.en ?? '')
    if (!key) continue
    const id = p._id.replace(/^drafts\./, '')
    if (!phraseIdByEnKey.has(key)) phraseIdByEnKey.set(key, id)
  }

  const mismatchResult = await partA(recon, phraseIdByEnKey)

  const docs = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type in [
      "portfolioEntry","blogPost","page","industry","market","videoFormat",
      "category","siteSettings","platform","client"
    ] && !defined(trash.trashedAt) && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
      _id, _type,
      title, excerpt, description, heroTitle, heroFilmTitle, name,
      displayTitleParts,
      additionalVideos[]{videoTitle, description},
      founders[]{jobTitle},
      body,
      seo,
      contactAddress, contactModalTitle, contactModalIntro, contactModalContent, contactCtaText,
      campaignCta,
      crewCredits[]{role, people[]{name}}
    }`,
  )

  const fieldHits: FieldHit[] = []
  for (const doc of docs) {
    fieldHits.push(...collectFieldsFromDoc(doc))
  }

  const missingResult = await partB(recon, fieldHits)

  // Harvest breakdown by found_in
  const byFoundIn = new Map<string, number>()
  for (const h of missingResult.harvest) {
    byFoundIn.set(h.found_in, (byFoundIn.get(h.found_in) ?? 0) + 1)
  }

  console.log(
    JSON.stringify(
      {
        part_a: {
          counts: mismatchResult.counts,
          mechanical_only: mismatchResult.mechanical_only,
          real_difference: mismatchResult.real_difference,
          output: MISMATCH_OUT,
        },
        part_b: {
          counts: missingResult.counts,
          harvest_by_found_in: Object.fromEntries(
            [...byFoundIn.entries()].sort((a, b) => b[1] - a[1]),
          ),
          harvest_sample: missingResult.harvest.slice(0, 15),
          harvest_exact: missingResult.harvest.filter(
            (h) => h.match_kind === 'exact',
          ).length,
          harvest_substring: missingResult.harvest.filter(
            (h) => h.match_kind === 'substring',
          ).length,
          docs_scanned: docs.length,
          field_values_scanned: fieldHits.length,
          output: MISSING_OUT,
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
