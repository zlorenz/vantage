/**
 * Apply document-differs WP wins (titleZh / videoTitleZh) + delete garbage phrase.
 * Cross-checks document-differs-for-review.json; skips 3 keep-Sanity rows.
 *
 * Usage: npx tsx scripts/migration/patch/apply-title-differs-write.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadEnv} from 'dotenv'
import {createClient} from '@sanity/client'

import {PATHS, SANITY} from '../config'

loadEnv({path: path.resolve(process.cwd(), '.env.local')})

const DIFFERS_PATH = path.join(
  PATHS.migrationData,
  'wp-translation-audit',
  'document-differs-for-review.json',
)

/** Sanity's fuller/official ZH wins — do not overwrite. */
const KEEP_SANITY_IDS = new Set([
  'portfolio-2747', // DJI RoboMaster S1
  'portfolio-2738', // DJI Zenmuse XT2
  'portfolio-2061', // Realme X7 – Fast & Powerful
])

const DELETE_PHRASE_ID = 'phrase.words.5cb7aa8a'

type DifferRow = {
  en: string
  zh_wp: string
  zh_sanity_current: string
  documentType: string
  documentId: string
  fieldName: string
}

/** Map EN field path from audit → Zh field path to patch. */
function enFieldToZhPatchPath(fieldName: string): string {
  // portfolioEntry.title → titleZh
  // portfolioEntry.additionalVideos[0].videoTitle → additionalVideos[0].videoTitleZh
  const withoutType = fieldName.replace(/^portfolioEntry\./, '')
  if (withoutType === 'title') return 'titleZh'
  const videoMatch = withoutType.match(
    /^additionalVideos\[(\d+)\]\.videoTitle$/,
  )
  if (videoMatch) {
    return `additionalVideos[${videoMatch[1]}].videoTitleZh`
  }
  throw new Error(`Unsupported fieldName for Zh patch: ${fieldName}`)
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

  const differs = JSON.parse(fs.readFileSync(DIFFERS_PATH, 'utf8')) as {
    rows: DifferRow[]
  }

  // --- Step 1: delete garbage phrase ---
  const phraseBefore = await client.fetch<{_id: string; en?: string; zh?: string} | null>(
    `*[_id == $id || _id == $draftId][0]{_id, en, zh}`,
    {id: DELETE_PHRASE_ID, draftId: `drafts.${DELETE_PHRASE_ID}`},
  )
  const txDelete = client.transaction()
  txDelete.delete(DELETE_PHRASE_ID)
  txDelete.delete(`drafts.${DELETE_PHRASE_ID}`)
  await txDelete.commit({visibility: 'sync'})
  const phraseAfter = await client.fetch(
    `*[_id == $id || _id == $draftId]{_id}`,
    {id: DELETE_PHRASE_ID, draftId: `drafts.${DELETE_PHRASE_ID}`},
  )

  // --- Steps 2–4: apply WP wins / skip keep-Sanity ---
  const skipped: Array<{documentId: string; en: string; reason: string}> = []
  const applied: Array<{
    documentId: string
    en: string
    patchPath: string
    before: string | null
    after: string | null
    zh_wp: string
  }> = []

  for (const row of differs.rows) {
    if (KEEP_SANITY_IDS.has(row.documentId)) {
      skipped.push({
        documentId: row.documentId,
        en: row.en,
        reason: 'keep Sanity (fuller/official ZH)',
      })
      continue
    }

    const patchPath = enFieldToZhPatchPath(row.fieldName)
    const zh_wp = row.zh_wp // exact from source JSON

    // Read current Zh for confirmation
    let before: string | null = null
    if (patchPath === 'titleZh') {
      const doc = await client.fetch<{titleZh?: string} | null>(
        `*[_id == $id][0]{titleZh}`,
        {id: row.documentId},
      )
      before = doc?.titleZh ?? null
    } else {
      const m = patchPath.match(/^additionalVideos\[(\d+)\]\.videoTitleZh$/)
      if (!m) throw new Error(`bad path ${patchPath}`)
      const idx = Number(m[1])
      const doc = await client.fetch<{additionalVideos?: Array<{videoTitleZh?: string}>} | null>(
        `*[_id == $id][0]{additionalVideos[]{videoTitleZh}}`,
        {id: row.documentId},
      )
      before = doc?.additionalVideos?.[idx]?.videoTitleZh ?? null
    }

    await client
      .patch(row.documentId)
      .set({[patchPath]: zh_wp})
      .commit({visibility: 'sync'})

    let after: string | null = null
    if (patchPath === 'titleZh') {
      const doc = await client.fetch<{titleZh?: string} | null>(
        `*[_id == $id][0]{titleZh}`,
        {id: row.documentId},
      )
      after = doc?.titleZh ?? null
    } else {
      const m = patchPath.match(/^additionalVideos\[(\d+)\]\.videoTitleZh$/)!
      const idx = Number(m[1])
      const doc = await client.fetch<{additionalVideos?: Array<{videoTitleZh?: string}>} | null>(
        `*[_id == $id][0]{additionalVideos[]{videoTitleZh}}`,
        {id: row.documentId},
      )
      after = doc?.additionalVideos?.[idx]?.videoTitleZh ?? null
    }

    if (after !== zh_wp) {
      throw new Error(
        `Verify failed ${row.documentId} ${patchPath}: expected ${JSON.stringify(zh_wp)} got ${JSON.stringify(after)}`,
      )
    }

    applied.push({
      documentId: row.documentId,
      en: row.en,
      patchPath,
      before,
      after,
      zh_wp,
    })
  }

  console.log(
    JSON.stringify(
      {
        phrase_deleted: {
          id: DELETE_PHRASE_ID,
          existed_before: phraseBefore,
          still_present: phraseAfter,
          ok: Array.isArray(phraseAfter) && phraseAfter.length === 0,
        },
        keep_sanity_ids: [...KEEP_SANITY_IDS],
        applied_count: applied.length,
        skipped_count: skipped.length,
        skipped,
        applied,
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
