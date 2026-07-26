/**
 * Live EN inventory vs phrase book — unused detection + master table rows.
 */

import {
  CREW_DEPARTMENTS,
  CREDIT_LABEL_ZH,
  CREW_ROLE_BY_KEY,
  canonicalCrewRoleLabel,
  isCrewRolePluralAlias,
} from '../crew-credits'
import {FIELD_MAPS} from '../ai-translation/field-map'
import {asPlainString, getAtPath} from '../ai-translation/paths'
import type {TranslateDocumentType} from '../ai-translation/types'

import {
  categoryForCmsField,
  isCompanyCrewRole,
  preferCategory,
  type PhraseCategoryId,
} from './categories'

function normalizePhraseKey(en: string | null | undefined): string {
  return (en ?? '').replace(/\s+/g, ' ').trim()
}

function phraseDocumentId(en: string): string {
  const key = normalizePhraseKey(en)
  const slug = key
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  let hash = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0')
  return `phrase.${slug || 'x'}.${hex}`
}

export type LiveEnHit = {
  en: string
  source: string
  documentId?: string
  documentType?: string
  enPath?: string
  category: PhraseCategoryId
}

export type PhraseDocRow = {
  _id: string
  en?: string | null
  zh?: string | null
}

export type UnusedPhraseRow = {
  _id: string
  en: string
  zh: string
  hasSpan: boolean
}

export type PhraseUsageReport = {
  liveEnCount: number
  phraseCount: number
  inUseCount: number
  unusedCount: number
  unusedWithSpanCount: number
  unused: UnusedPhraseRow[]
  inUseSample: string[]
}

export type PhraseUsageRef = {
  documentId: string
  documentType: string
  enPath: string
  source: string
}

export type PhraseTableRow = {
  id: string
  en: string
  zh: string
  phraseId?: string
  useCount: number
  category: PhraseCategoryId
  status: 'missing' | 'present'
  editable: boolean
  source: 'cms' | 'code' | 'catalog'
  codePath?: string
  usages: PhraseUsageRef[]
}

const PLAIN_DOC_TYPES = [
  'portfolioEntry',
  'blogPost',
  'page',
  'industry',
  'market',
  'videoFormat',
  'category',
  'siteSettings',
] as const

/** GROQ projection for docs scanned when building the live EN set. */
export const PHRASE_INVENTORY_DOCS_QUERY = `*[_type in [
  "portfolioEntry","blogPost","page","industry","market","videoFormat","category","siteSettings"
] && !defined(trash.trashedAt) && !(_id in path("versions.**"))]{
  _id, _type, title, name,
  displayTitleParts,
  heroFilmTitle,
  excerpt, description,
  heroTitle,
  additionalVideos[]{videoTitle, description},
  founders[]{jobTitle},
  crewCredits[]{
    role, roleKey, isCustomRole, department,
    people[]{name, "identityName": identity->name}
  },
  seo,
  contactAddress, contactModalTitle, contactModalIntro, contactCtaText
}`

export const PHRASE_INVENTORY_PHRASES_QUERY = `*[_type == "translatedPhrase" && !(_id in path("versions.**"))]{_id, en, zh}`

export function phraseContainsSpan(en: string): boolean {
  return /<span[\s>]/i.test(en)
}

function pushHit(
  out: LiveEnHit[],
  enRaw: string,
  partial: Omit<LiveEnHit, 'en'>,
): void {
  const en = normalizePhraseKey(enRaw)
  if (!en) return
  out.push({...partial, en})
}

function collectPlainEnFromDoc(
  doc: Record<string, unknown>,
  out: LiveEnHit[],
): void {
  const type = String(doc._type ?? '')
  const id = String(doc._id ?? '').replace(/^drafts\./, '')

  // Human names (creditIdentity / non-company crew people) are never phrase-booked.
  if (type === 'creditIdentity') return

  if (type === 'portfolioEntry') {
    collectCrewRoleHits(doc, id, out)
    collectCompanyNameHits(doc, id, out)
  }

  if (!(type in FIELD_MAPS)) return
  const maps = FIELD_MAPS[type as TranslateDocumentType]

  for (const mapping of maps) {
    if (mapping.kind !== 'plain') continue
    if (!mapping.enPath) continue
    // Skip SEO meta from phrase table (plan: out of editable phrase table with slugs)
    if (mapping.enPath === 'seo.metaDescription') continue
    collectEnAtPath(
      mapping.enPath,
      doc,
      type,
      id,
      categoryForCmsField(type, mapping.enPath),
      out,
    )
  }
}

/**
 * Company vendor names from every portfolio company field:
 * - displayTitleParts.brandName (via FIELD_MAPS)
 * - Brand / Agency / Production Company / Production Service crew people
 *   (denormalized name, else linked creditIdentity name)
 *
 * Other crew people (humans) are intentionally excluded from the phrase book.
 */
function collectCompanyNameHits(
  doc: Record<string, unknown>,
  documentId: string,
  out: LiveEnHit[],
): void {
  const credits = doc.crewCredits
  if (Array.isArray(credits)) {
    credits.forEach((raw, creditIndex) => {
      if (!raw || typeof raw !== 'object') return
      const credit = raw as {
        role?: string
        roleKey?: string
        people?: unknown
      }
      if (!isCompanyCrewRole(credit.roleKey, credit.role)) return
      const people = credit.people
      if (!Array.isArray(people)) return
      people.forEach((person, personIndex) => {
        if (!person || typeof person !== 'object') return
        const row = person as Record<string, unknown>
        const name =
          asPlainString(row.name) || asPlainString(row.identityName)
        pushHit(out, name, {
          source: `portfolioEntry:${documentId}:crewCredits[${creditIndex}].people[${personIndex}].name`,
          documentId,
          documentType: 'portfolioEntry',
          enPath: 'crewCredits[].people.name',
          category: 'companies',
        })
      })
    })
  }
}

function collectCrewRoleHits(
  doc: Record<string, unknown>,
  documentId: string,
  out: LiveEnHit[],
): void {
  const credits = doc.crewCredits
  if (!Array.isArray(credits)) return

  credits.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return
    const credit = raw as {
      role?: string
      roleKey?: string
      isCustomRole?: boolean
      department?: string
    }
    let label = normalizePhraseKey(credit.role)
    if (!label && credit.roleKey && !credit.isCustomRole) {
      label = normalizePhraseKey(
        CREW_ROLE_BY_KEY.get(credit.roleKey)?.role.label,
      )
    }
    if (!label) return
    // Singular/plural share one phrase-book entity (canonical singular).
    label = canonicalCrewRoleLabel(label)
    pushHit(out, label, {
      source: `portfolioEntry:${documentId}:crewCredits[${index}].role`,
      documentId,
      documentType: 'portfolioEntry',
      enPath: 'crewCredits[].role',
      category: 'crew-roles',
    })
  })
}

function collectEnAtPath(
  enPath: string,
  doc: Record<string, unknown>,
  documentType: string,
  documentId: string,
  category: PhraseCategoryId,
  out: LiveEnHit[],
): void {
  if (enPath.includes('[]')) {
    const match = enPath.match(/^(.+)\[\]\.(.+)$/)
    if (!match) return
    const arr = getAtPath(doc, match[1]!)
    if (!Array.isArray(arr)) return
    arr.forEach((item, index) => {
      if (!item || typeof item !== 'object') return
      const en = asPlainString((item as Record<string, unknown>)[match[2]!])
      pushHit(out, en, {
        source: `${documentType}:${documentId}:${enPath}[${index}]`,
        documentId,
        documentType,
        enPath,
        category,
      })
    })
    return
  }

  pushHit(out, asPlainString(getAtPath(doc, enPath)), {
    source: `${documentType}:${documentId}:${enPath}`,
    documentId,
    documentType,
    enPath,
    category,
  })
}

/** Catalog department + role labels (always “live” for GC / table). */
export function collectCatalogCrewRoleHits(): LiveEnHit[] {
  const out: LiveEnHit[] = []
  for (const dept of CREW_DEPARTMENTS) {
    pushHit(out, dept.label, {
      source: `catalog:department:${dept.key}`,
      category: 'crew-roles',
    })
    for (const role of dept.roles) {
      // Plural labels alias the singular — one phrase-book row per role.
      pushHit(out, role.label, {
        source: `catalog:role:${role.key}`,
        category: 'crew-roles',
      })
    }
  }
  return out
}

/** Collect every normalized plain EN string currently present on CMS docs. */
export function collectLiveEnHits(
  docs: Array<Record<string, unknown>>,
): LiveEnHit[] {
  const out: LiveEnHit[] = []
  for (const doc of docs) {
    if (!doc || typeof doc !== 'object') continue
    collectPlainEnFromDoc(doc, out)
  }
  return out
}

/** CMS + catalog crew roles (for unused GC and master table). */
export function collectAllLiveEnHits(
  docs: Array<Record<string, unknown>>,
): LiveEnHit[] {
  return [...collectLiveEnHits(docs), ...collectCatalogCrewRoleHits()]
}

export function liveEnSet(hits: LiveEnHit[]): Set<string> {
  return new Set(hits.map((h) => h.en))
}

/**
 * Classify phrase docs: unused = EN not present on any scanned plain CMS field
 * (or catalog crew role labels).
 */
export function classifyPhraseUsage(
  phrases: PhraseDocRow[],
  live: Set<string>,
): PhraseUsageReport {
  const unused: UnusedPhraseRow[] = []
  const inUseSample: string[] = []
  let inUseCount = 0

  for (const row of phrases) {
    const id = String(row._id ?? '').replace(/^drafts\./, '')
    const en = normalizePhraseKey(row.en)
    const zh = normalizePhraseKey(row.zh)
    if (!en) {
      unused.push({_id: id, en: '', zh, hasSpan: false})
      continue
    }
    if (live.has(en)) {
      inUseCount += 1
      if (inUseSample.length < 20) inUseSample.push(en)
      continue
    }
    unused.push({
      _id: id,
      en,
      zh,
      hasSpan: phraseContainsSpan(en),
    })
  }

  unused.sort((a, b) => a.en.localeCompare(b.en))

  return {
    liveEnCount: live.size,
    phraseCount: phrases.length,
    inUseCount,
    unusedCount: unused.length,
    unusedWithSpanCount: unused.filter((u) => u.hasSpan).length,
    unused,
    inUseSample,
  }
}

type Acc = {
  en: string
  category: PhraseCategoryId
  usages: PhraseUsageRef[]
  /** `${documentType}:${publishedId}` — catalog hits omitted. */
  docKeys: Set<string>
}

/**
 * Build deduped master-table rows from live hits + phrase book (+ optional code rows).
 * Uses = unique published CMS documents containing the string (catalog stubs = 0).
 */
export function buildPhraseTableRows(args: {
  hits: LiveEnHit[]
  phrases: PhraseDocRow[]
  codeRows?: Array<{
    en: string
    zh: string
    codePath: string
    category?: PhraseCategoryId
  }>
}): PhraseTableRow[] {
  const phraseByEn = new Map<string, PhraseDocRow>()
  for (const row of args.phrases) {
    const en = normalizePhraseKey(row.en)
    if (!en) continue
    const id = String(row._id ?? '').replace(/^drafts\./, '')
    const existing = phraseByEn.get(en)
    if (!existing || String(row._id).startsWith('drafts.')) {
      phraseByEn.set(en, {...row, _id: id})
    }
  }

  const byEn = new Map<string, Acc>()
  for (const hit of args.hits) {
    let acc = byEn.get(hit.en)
    if (!acc) {
      acc = {
        en: hit.en,
        category: hit.category,
        usages: [],
        docKeys: new Set(),
      }
      byEn.set(hit.en, acc)
    }
    acc.category = preferCategory(acc.category, hit.category)

    if (!hit.documentId || !hit.documentType) continue

    const publishedId = hit.documentId.replace(/^drafts\./, '')
    acc.docKeys.add(`${hit.documentType}:${publishedId}`)

    if (hit.enPath && acc.usages.length < 40) {
      const already = acc.usages.some(
        (u) =>
          u.documentId === publishedId &&
          u.documentType === hit.documentType &&
          u.enPath === hit.enPath,
      )
      if (!already) {
        acc.usages.push({
          documentId: publishedId,
          documentType: hit.documentType,
          enPath: hit.enPath,
          source: hit.source,
        })
      }
    }
  }

  const rows: PhraseTableRow[] = []

  for (const acc of byEn.values()) {
    const phrase = phraseByEn.get(acc.en)
    const zh = normalizePhraseKey(phrase?.zh)

    let useCount = acc.docKeys.size
    let usages = acc.usages

    rows.push({
      id: `phrase:${acc.en}`,
      en: acc.en,
      zh,
      phraseId: phrase?._id,
      useCount,
      category: acc.category,
      status: zh ? 'present' : 'missing',
      editable: true,
      source: useCount === 0 && acc.category === 'crew-roles' ? 'catalog' : 'cms',
      usages,
    })
  }

  for (const code of args.codeRows ?? []) {
    const en = normalizePhraseKey(code.en)
    if (!en) continue
    if (byEn.has(en)) continue
    const phrase = phraseByEn.get(en)
    const zh = normalizePhraseKey(phrase?.zh) || normalizePhraseKey(code.zh)
    rows.push({
      id: `code:${en}`,
      en,
      zh,
      phraseId: phrase?._id,
      useCount: 0,
      category: code.category ?? 'interface',
      status: zh ? 'present' : 'missing',
      editable: false,
      source: 'code',
      codePath: code.codePath,
      usages: [],
    })
  }

  rows.sort((a, b) => a.en.localeCompare(b.en))
  return rows
}

/**
 * Pairs to upsert into the phrase book for catalog crew roles/departments only.
 *
 * Do not seed the full CREDIT_LABEL_ZH map — freeform/custom keys (e.g. Graphic
 * Design, Camera Assistant) are not live until they appear on a CMS credit row.
 * Seeding them caused a Purge unused ↔ reopen Translations loop.
 * Runtime still falls back to CREDIT_LABEL_ZH when no phrase exists.
 */
export function creditLabelSeedPairs(): Array<{en: string; zh: string}> {
  const out: Array<{en: string; zh: string}> = []
  const seen = new Set<string>()

  const push = (enRaw: string) => {
    const enNorm = normalizePhraseKey(enRaw)
    if (!enNorm || phraseContainsSpan(enNorm)) return
    if (isCrewRolePluralAlias(enNorm)) return
    const en = canonicalCrewRoleLabel(enNorm)
    if (seen.has(en)) return
    const zh = normalizePhraseKey(CREDIT_LABEL_ZH[en] ?? CREDIT_LABEL_ZH[enNorm])
    if (!zh) return
    seen.add(en)
    out.push({en, zh})
  }

  for (const dept of CREW_DEPARTMENTS) {
    push(dept.label)
    for (const role of dept.roles) {
      push(role.label)
    }
  }
  return out
}

export function seedPhraseDoc(en: string, zh: string) {
  return {
    _id: phraseDocumentId(en),
    _type: 'translatedPhrase' as const,
    en: normalizePhraseKey(en),
    zh: normalizePhraseKey(zh),
  }
}

export {PLAIN_DOC_TYPES}
