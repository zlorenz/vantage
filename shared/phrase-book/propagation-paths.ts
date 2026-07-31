/**
 * Field paths eligible for phrase-book ZH propagation.
 *
 * Base: FIELD_MAPS plain pairs, excluding slugs, Portable Text, HTML, and the
 * read-only portfolioEntry title/titleZh pair (recomputed from display parts).
 * Extras: seo.metaTitle, campaignCta, creditIdentity (confirmed assisted but
 * missing from FIELD_MAPS).
 */

import {FIELD_MAPS} from '../ai-translation/field-map'

export type PhrasePropagationPath = {
  docType: string
  enPath: string
  zhPath: string
}

const EXTRAS: PhrasePropagationPath[] = [
  {
    docType: 'portfolioEntry',
    enPath: 'seo.metaTitle',
    zhPath: 'seo.metaTitleZh',
  },
  {
    docType: 'blogPost',
    enPath: 'seo.metaTitle',
    zhPath: 'seo.metaTitleZh',
  },
  {
    docType: 'page',
    enPath: 'seo.metaTitle',
    zhPath: 'seo.metaTitleZh',
  },
  {
    docType: 'siteSettings',
    enPath: 'campaignCta.heading',
    zhPath: 'campaignCta.headingZh',
  },
  {
    docType: 'siteSettings',
    enPath: 'campaignCta.buttonLabel',
    zhPath: 'campaignCta.buttonLabelZh',
  },
  {
    docType: 'creditIdentity',
    enPath: 'name',
    zhPath: 'nameZh',
  },
]

function pathsFromFieldMaps(): PhrasePropagationPath[] {
  const out: PhrasePropagationPath[] = []
  for (const [docType, maps] of Object.entries(FIELD_MAPS)) {
    for (const mapping of maps) {
      if (mapping.kind !== 'plain') continue
      if (
        mapping.enPath.includes('slug') ||
        mapping.zhPath.includes('slug')
      ) {
        continue
      }
      // Portfolio titleZh is recomputed from displayTitleParts after patches.
      if (
        docType === 'portfolioEntry' &&
        mapping.enPath === 'title' &&
        mapping.zhPath === 'titleZh'
      ) {
        continue
      }
      out.push({
        docType,
        enPath: mapping.enPath,
        zhPath: mapping.zhPath,
      })
    }
  }
  return out
}

function dedupe(paths: PhrasePropagationPath[]): PhrasePropagationPath[] {
  const seen = new Set<string>()
  const out: PhrasePropagationPath[] = []
  for (const p of paths) {
    const key = `${p.docType}\0${p.enPath}\0${p.zhPath}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out
}

export const PHRASE_PROPAGATION_PATHS: PhrasePropagationPath[] = dedupe([
  ...pathsFromFieldMaps(),
  ...EXTRAS,
])

export const PROPAGATION_DOC_TYPES: string[] = [
  ...new Set(PHRASE_PROPAGATION_PATHS.map((p) => p.docType)),
]

/** Split `additionalVideos[].videoTitle` → {arrayPath, field}. */
export function splitArrayPath(path: string): {
  arrayPath: string
  field: string
} | null {
  const idx = path.indexOf('[]')
  if (idx < 0) return null
  const arrayPath = path.slice(0, idx).replace(/\.$/, '')
  const field = path
    .slice(idx + 2)
    .replace(/^\./, '')
  if (!arrayPath || !field) return null
  return {arrayPath, field}
}

/** GROQ boolean expression: any mapped ZH field equals $oldZh. */
export function buildOldZhMatchClause(
  paths: PhrasePropagationPath[] = PHRASE_PROPAGATION_PATHS,
): string {
  const clauses: string[] = []
  const seen = new Set<string>()
  for (const p of paths) {
    const array = splitArrayPath(p.zhPath)
    const clause = array
      ? `count(${array.arrayPath}[${array.field} == $oldZh]) > 0`
      : `${p.zhPath} == $oldZh`
    if (seen.has(clause)) continue
    seen.add(clause)
    clauses.push(clause)
  }
  return clauses.join('\n    || ')
}

export function buildCandidateQuery(
  paths: PhrasePropagationPath[] = PHRASE_PROPAGATION_PATHS,
): string {
  const types = [...new Set(paths.map((p) => p.docType))]
  const match = buildOldZhMatchClause(paths)
  return `*[
  _type in $types
  && !defined(trash.trashedAt)
  && !(_id in path("drafts.**"))
  && !(_id in path("versions.**"))
  && (
    ${match}
  )
]{
  ...,
  _id,
  _type
}`
}

export const DISPLAY_TITLE_ZH_PATHS = new Set([
  'displayTitleParts.brandNameZh',
  'displayTitleParts.productNameZh',
  'displayTitleParts.campaignTitleZh',
])
