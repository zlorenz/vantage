/**
 * Audit / purge phrase-book rows whose EN no longer appears on any CMS plain field.
 *
 * Dry-run by default:
 *   npm run migrate:audit:phrase-book-unused
 *   npm run migrate:audit:phrase-book-unused -- --apply
 *
 * Report: scripts/migration/data/phrase-book-unused.json
 */

import fs from 'node:fs'
import path from 'node:path'

import {
  collectAllLiveEnHits,
  liveEnSet,
  classifyPhraseUsage,
  PHRASE_INVENTORY_DOCS_QUERY,
  PHRASE_INVENTORY_PHRASES_QUERY,
  type PhraseDocRow,
} from '../../../shared/phrase-book/inventory'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

const REPORT_PATH = path.join(
  process.cwd(),
  'scripts/migration/data/phrase-book-unused.json',
)

async function main() {
  const client = getWriteClient()

  const [docs, phrasesRaw] = await Promise.all([
    client.fetch<Array<Record<string, unknown>>>(PHRASE_INVENTORY_DOCS_QUERY),
    client.fetch<PhraseDocRow[]>(PHRASE_INVENTORY_PHRASES_QUERY),
  ])

  // One row per published id (draft + published would otherwise double-count).
  const phrasesById = new Map<string, PhraseDocRow>()
  for (const row of phrasesRaw) {
    const id = String(row._id ?? '').replace(/^drafts\./, '')
    if (!id) continue
    const existing = phrasesById.get(id)
    // Prefer draft content when both exist (latest edits).
    if (!existing || String(row._id).startsWith('drafts.')) {
      phrasesById.set(id, {...row, _id: id})
    }
  }
  const phrases = [...phrasesById.values()]

  const hits = collectAllLiveEnHits(docs)
  const live = liveEnSet(hits)
  const report = classifyPhraseUsage(phrases, live)

  const payload = {
    generatedAt: new Date().toISOString(),
    apply: APPLY,
    liveEnCount: report.liveEnCount,
    phraseCount: report.phraseCount,
    inUseCount: report.inUseCount,
    unusedCount: report.unusedCount,
    unusedWithSpanCount: report.unusedWithSpanCount,
    inUseSample: report.inUseSample,
    unusedSample: report.unused.slice(0, 40).map((u) => ({
      _id: u._id,
      en: u.en,
      zh: u.zh,
      hasSpan: u.hasSpan,
    })),
    unused: report.unused,
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), {recursive: true})
  fs.writeFileSync(REPORT_PATH, JSON.stringify(payload, null, 2))

  console.log(`Live unique EN: ${report.liveEnCount}`)
  console.log(`Phrase book rows: ${report.phraseCount}`)
  console.log(`In use: ${report.inUseCount}`)
  console.log(`Unused: ${report.unusedCount} (${report.unusedWithSpanCount} contain <span)`)
  console.log(`Report: ${REPORT_PATH}`)

  if (report.unused.slice(0, 15).length) {
    console.log('\nUnused sample:')
    for (const row of report.unused.slice(0, 15)) {
      const flag = row.hasSpan ? ' [span]' : ''
      console.log(`  - ${row.en.slice(0, 80)}${flag}`)
    }
  }

  if (!APPLY) {
    console.log('\nDry-run only. Re-run with --apply to delete unused phrases.')
    return
  }

  if (report.unused.length === 0) {
    console.log('Nothing to delete.')
    return
  }

  let deleted = 0
  const BATCH = 25
  for (let i = 0; i < report.unused.length; i += BATCH) {
    const chunk = report.unused.slice(i, i + BATCH)
    const tx = client.transaction()
    for (const row of chunk) {
      const id = row._id.replace(/^drafts\./, '')
      tx.delete(id)
      tx.delete(`drafts.${id}`)
    }
    await tx.commit({visibility: 'async'})
    deleted += chunk.length
    console.log(`Deleted ${deleted}/${report.unused.length}…`)
  }

  console.log(`Done. Deleted ${deleted} unused phrase documents.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
