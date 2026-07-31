/**
 * Plan phrase-book ZH propagation patches from candidate documents.
 *
 * Safety rule: only update a ZH field when BOTH
 *   (a) current ZH === old phrase zh (normalized), AND
 *   (b) corresponding EN sibling === phrase en (normalized)
 */

import {stegaClean} from '@sanity/client/stega'

import {asPlainString, getAtPath} from '../ai-translation/paths'
import {resolveDisplayTitles} from '../display-titles'
import {
  DISPLAY_TITLE_ZH_PATHS,
  PHRASE_PROPAGATION_PATHS,
  splitArrayPath,
  type PhrasePropagationPath,
} from './propagation-paths'

function normalizePhraseKey(en: string | null | undefined): string {
  return stegaClean(en ?? '').replace(/\s+/g, ' ').trim()
}

export type PropagationInput = {
  phraseId: string
  phraseEn: string
  oldZh: string
  newZh: string
}

export type PropagationPatch = {
  docId: string
  docType: string
  fieldPath: string
  /** Sanity patch path key (may use [_key=="..."] for array items). */
  setPath: string
  newValue: string
}

export type PropagationSkip = {
  docId: string
  docType: string
  fieldPath: string
  reason: 'en-mismatch'
  expectedEn: string
  actualEn: string
}

export type PropagationPlan = {
  patches: PropagationPatch[]
  skips: PropagationSkip[]
  /** portfolioEntry docs that need titleZh recompute after part ZH patches. */
  titleRecomputeIds: string[]
}

export function planPhrasePropagation(
  docs: Array<Record<string, unknown>>,
  input: PropagationInput,
  paths: PhrasePropagationPath[] = PHRASE_PROPAGATION_PATHS,
): PropagationPlan {
  const oldZh = normalizePhraseKey(input.oldZh)
  const newZh = normalizePhraseKey(input.newZh)
  const phraseEn = normalizePhraseKey(input.phraseEn)

  const patches: PropagationPatch[] = []
  const skips: PropagationSkip[] = []
  const titleRecompute = new Set<string>()

  if (!oldZh || !newZh || oldZh === newZh || !phraseEn) {
    return {patches, skips, titleRecomputeIds: []}
  }

  for (const doc of docs) {
    const docId = String(doc._id ?? '')
    const docType = String(doc._type ?? '')
    if (!docId || !docType) continue

    const typePaths = paths.filter((p) => p.docType === docType)
    for (const path of typePaths) {
      const array = splitArrayPath(path.zhPath)
      if (array) {
        const enParts = splitArrayPath(path.enPath)
        const enField = enParts?.field ?? ''
        const arr = getAtPath(doc, array.arrayPath)
        if (!Array.isArray(arr)) continue
        for (const item of arr) {
          if (!item || typeof item !== 'object') continue
          const row = item as Record<string, unknown>
          const key = typeof row._key === 'string' ? row._key : null
          if (!key) continue
          const zhVal = normalizePhraseKey(asPlainString(row[array.field]))
          if (zhVal !== oldZh) continue
          const enVal = normalizePhraseKey(asPlainString(row[enField]))
          const fieldPath = `${array.arrayPath}[_key=="${key}"].${array.field}`
          if (enVal !== phraseEn) {
            skips.push({
              docId,
              docType,
              fieldPath,
              reason: 'en-mismatch',
              expectedEn: phraseEn,
              actualEn: enVal,
            })
            continue
          }
          patches.push({
            docId,
            docType,
            fieldPath,
            setPath: fieldPath,
            newValue: input.newZh,
          })
        }
        continue
      }

      const zhVal = normalizePhraseKey(asPlainString(getAtPath(doc, path.zhPath)))
      if (zhVal !== oldZh) continue
      const enVal = normalizePhraseKey(asPlainString(getAtPath(doc, path.enPath)))
      if (enVal !== phraseEn) {
        skips.push({
          docId,
          docType,
          fieldPath: path.zhPath,
          reason: 'en-mismatch',
          expectedEn: phraseEn,
          actualEn: enVal,
        })
        continue
      }
      patches.push({
        docId,
        docType,
        fieldPath: path.zhPath,
        setPath: path.zhPath,
        newValue: input.newZh,
      })
      if (DISPLAY_TITLE_ZH_PATHS.has(path.zhPath)) {
        titleRecompute.add(docId)
      }
    }
  }

  return {
    patches,
    skips,
    titleRecomputeIds: [...titleRecompute],
  }
}

/**
 * Compute portfolioEntry.titleZh from display parts after applying planned ZH
 * patches in-memory (does not reimplement compile — uses resolveDisplayTitles).
 */
export function computeTitleZhAfterPatches(
  doc: Record<string, unknown>,
  patches: PropagationPatch[],
): string | null {
  if (String(doc._type) !== 'portfolioEntry') return null

  const parts = {
    ...((doc.displayTitleParts as Record<string, unknown> | undefined) ?? {}),
  }
  let heroFilmTitleZh =
    typeof doc.heroFilmTitleZh === 'string' ? doc.heroFilmTitleZh : undefined

  for (const patch of patches) {
    if (patch.docId !== String(doc._id)) continue
    if (patch.setPath === 'displayTitleParts.brandNameZh') {
      parts.brandNameZh = patch.newValue
    } else if (patch.setPath === 'displayTitleParts.productNameZh') {
      parts.productNameZh = patch.newValue
    } else if (patch.setPath === 'displayTitleParts.campaignTitleZh') {
      parts.campaignTitleZh = patch.newValue
    } else if (patch.setPath === 'heroFilmTitleZh') {
      heroFilmTitleZh = patch.newValue
    }
  }

  return resolveDisplayTitles(
    {
      brandName: asPlainString(parts.brandName),
      productName: asPlainString(parts.productName),
      campaignTitle: asPlainString(parts.campaignTitle),
      heroFilmTitle: asPlainString(doc.heroFilmTitle),
      brandNameZh: asPlainString(parts.brandNameZh),
      productNameZh: asPlainString(parts.productNameZh),
      campaignTitleZh: asPlainString(parts.campaignTitleZh),
      heroFilmTitleZh: asPlainString(heroFilmTitleZh),
    },
    'zh',
  )
    .documentTitle.replace(/\s+/g, ' ')
    .trim()
}

/** Group patches by document for batched Sanity transactions. */
export function groupPatchesByDoc(
  patches: PropagationPatch[],
): Map<string, Record<string, string>> {
  const byDoc = new Map<string, Record<string, string>>()
  for (const patch of patches) {
    let set = byDoc.get(patch.docId)
    if (!set) {
      set = {}
      byDoc.set(patch.docId, set)
    }
    set[patch.setPath] = patch.newValue
  }
  return byDoc
}

export const PROPAGATION_CHUNK_SIZE = 50
