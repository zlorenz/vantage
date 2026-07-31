/**
 * Apply harvest-routing phrase-book creates + empty productNameZh fills.
 * Also writes document-differs-for-review.json (real differs only).
 *
 * Usage: npx tsx scripts/migration/patch/apply-harvest-write.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadEnv} from 'dotenv'
import {createClient} from '@sanity/client'

import {normalizePhraseKey, phraseDocumentId} from '../../../shared/phrase-book'
import {PATHS, SANITY} from '../config'
import {isPhraseHarvestExcluded} from '../lib/phrase-harvest-exclusions'
import {normalizeWhitespace} from '../lib/translation-text'

loadEnv({path: path.resolve(process.cwd(), '.env.local')})

const AUDIT_DIR = path.join(PATHS.migrationData, 'wp-translation-audit')
const ROUTING_PATH = path.join(AUDIT_DIR, 'harvest-routing.json')
const DIFFERS_OUT = path.join(AUDIT_DIR, 'document-differs-for-review.json')

type Routing = {
  phrase_book_candidate: Array<{en: string; zh_wp: string}>
  document_field_candidate: {
    empty_safe_to_fill: Array<{
      en: string
      zh_wp: string
      documentType: string
      documentId: string
      fieldName: string
    }>
    already_has_value_differs: Array<{
      en: string
      zh_wp: string
      zh_sanity_current: string
      documentType: string
      documentId: string
      fieldName: string
    }>
  }
}

function collapseWs(s: string): string {
  return normalizeWhitespace(s)
}

function stripTrailingPeriods(s: string): string {
  return collapseWs(s)
    .replace(/[。.．.]+$/u, '')
    .trim()
}

async function main() {
  const token =
    process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN || ''
  if (!token) throw new Error('Missing SANITY_API_WRITE_TOKEN / SANITY_API_TOKEN')

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? SANITY.projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token,
    useCdn: false,
  })

  const routing = JSON.parse(fs.readFileSync(ROUTING_PATH, 'utf8')) as Routing
  const candidates = routing.phrase_book_candidate
  if (candidates.length !== 71) {
    console.warn(
      `Expected 71 phrase_book_candidate rows, got ${candidates.length}`,
    )
  }

  // --- Step 1: create phrases ---
  const created: Array<{_id: string; en: string; zh: string}> = []
  const skipped_existing: Array<{_id: string; en: string; existing_zh: string}> =
    []
  const errors: Array<{en: string; error: string}> = []

  const skipped_excluded: Array<{en: string; reason: string}> = []

  for (const row of candidates) {
    const en = normalizePhraseKey(row.en)
    const zh = normalizePhraseKey(row.zh_wp)
    if (!en || !zh) {
      errors.push({en: row.en, error: 'empty en or zh after normalize'})
      continue
    }
    if (isPhraseHarvestExcluded(en)) {
      skipped_excluded.push({
        en,
        reason: 'homonym exclusion (Loader/Post — never auto-harvest)',
      })
      continue
    }
    const id = phraseDocumentId(en)

    const existing = await client.fetch<{_id: string; zh?: string} | null>(
      `*[_type == "translatedPhrase" && (en == $en || _id == $id || _id == $draftId)][0]{_id, en, zh}`,
      {en, id, draftId: `drafts.${id}`},
    )
    if (existing) {
      skipped_existing.push({
        _id: existing._id.replace(/^drafts\./, ''),
        en,
        existing_zh: String(existing.zh ?? ''),
      })
      continue
    }

    await client.createOrReplace({
      _id: id,
      _type: 'translatedPhrase',
      en,
      zh,
    })
    created.push({_id: id, en, zh})
  }

  // --- Step 2: empty productNameZh fills ---
  const empties = routing.document_field_candidate.empty_safe_to_fill
  const filled: Array<{
    documentId: string
    field: string
    zh: string
    before: string | null
    after: string | null
  }> = []

  for (const row of empties) {
    if (!row.fieldName.endsWith('displayTitleParts.productName')) {
      throw new Error(`Unexpected empty_safe field: ${row.fieldName}`)
    }
    const before = await client.fetch<{
      productName?: string
      productNameZh?: string
    } | null>(
      `*[_id == $id][0]{
        "productName": displayTitleParts.productName,
        "productNameZh": displayTitleParts.productNameZh
      }`,
      {id: row.documentId},
    )
    if (!before) throw new Error(`Missing doc ${row.documentId}`)
    if (normalizePhraseKey(before.productNameZh)) {
      throw new Error(
        `${row.documentId} productNameZh already set: ${before.productNameZh}`,
      )
    }
    await client
      .patch(row.documentId)
      .set({'displayTitleParts.productNameZh': row.zh_wp})
      .commit({visibility: 'sync'})

    const after = await client.fetch<{productNameZh?: string} | null>(
      `*[_id == $id][0]{"productNameZh": displayTitleParts.productNameZh}`,
      {id: row.documentId},
    )
    filled.push({
      documentId: row.documentId,
      field: 'displayTitleParts.productNameZh',
      zh: row.zh_wp,
      before: before.productNameZh ?? null,
      after: after?.productNameZh ?? null,
    })
  }

  // --- Step 3: real differs review file ---
  const mechanical_only: typeof routing.document_field_candidate.already_has_value_differs =
    []
  const real_differs: typeof routing.document_field_candidate.already_has_value_differs =
    []
  for (const row of routing.document_field_candidate.already_has_value_differs) {
    if (
      stripTrailingPeriods(row.zh_wp) ===
      stripTrailingPeriods(row.zh_sanity_current)
    ) {
      mechanical_only.push(row)
    } else {
      real_differs.push(row)
    }
  }

  const differsOut = {
    generated_at: new Date().toISOString(),
    notes:
      'Real wording differences only. Mechanical trailing-period TRP artifacts excluded — not written.',
    counts: {
      differs_input: routing.document_field_candidate.already_has_value_differs
        .length,
      mechanical_only_skipped: mechanical_only.length,
      real_differs_for_review: real_differs.length,
    },
    rows: real_differs.map((r) => ({
      en: r.en,
      zh_wp: r.zh_wp,
      zh_sanity_current: r.zh_sanity_current,
      documentType: r.documentType,
      documentId: r.documentId,
      fieldName: r.fieldName,
    })),
  }
  fs.writeFileSync(DIFFERS_OUT, JSON.stringify(differsOut, null, 2), 'utf8')

  console.log(
    JSON.stringify(
      {
        phrase_created_count: created.length,
        phrase_skipped_existing: skipped_existing.length,
        phrase_skipped_excluded: skipped_excluded.length,
        phrase_errors: errors,
        created,
        skipped_existing,
        skipped_excluded,
        filled,
        differs: differsOut.counts,
        differs_out: DIFFERS_OUT,
        real_differs: differsOut.rows,
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
