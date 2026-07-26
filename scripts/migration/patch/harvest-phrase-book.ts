/**
 * Harvest exact EN→ZH pairs into translatedPhrase documents.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/harvest-phrase-book.ts
 *   npx tsx scripts/migration/patch/harvest-phrase-book.ts --apply
 *
 * Writes scripts/migration/data/phrase-book-conflicts.json for EN keys with
 * multiple ZH values.
 */

import fs from 'node:fs'
import path from 'node:path'

import {FIELD_MAPS} from '../../../shared/ai-translation/field-map'
import {getAtPath} from '../../../shared/ai-translation/paths'
import {
  normalizePhraseKey,
  phraseContainsSpan,
  phraseDocumentId,
  PHRASE_UPSERT_MAX_EN_LENGTH,
} from '../../../shared/phrase-book'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

const CONFLICTS_PATH = path.join(
  process.cwd(),
  'scripts/migration/data/phrase-book-conflicts.json',
)
const REPORT_PATH = path.join(
  process.cwd(),
  'scripts/migration/data/phrase-book-harvest-report.json',
)

type PairHit = {
  en: string
  zh: string
  source: string
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
      if (
        en &&
        zh &&
        en.length <= PHRASE_UPSERT_MAX_EN_LENGTH &&
        !phraseContainsSpan(en)
      ) {
        out.push({en, zh, source: `${source}[${index}].${enField}`})
      }
    }
    return
  }

  const en = normalizePhraseKey(String(getAtPath(doc, enPath) ?? ''))
  const zh = normalizePhraseKey(String(getAtPath(doc, zhPath) ?? ''))
  if (
    en &&
    zh &&
    en.length <= PHRASE_UPSERT_MAX_EN_LENGTH &&
    !phraseContainsSpan(en)
  ) {
    out.push({en, zh, source})
  }
}

async function main() {
  const client = getWriteClient()

  const docs = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type in [
      "portfolioEntry","blogPost","page","industry","market","videoFormat","category","siteSettings","creditIdentity"
    ] && !defined(trash.trashedAt)]{
      _id, _type, title, titleZh, name, nameZh, slug, slugZh,
      displayTitleParts,
      excerpt, excerptZh, description, descriptionZh,
      heroTitle, heroTitleZh,
      additionalVideos[]{videoTitle, videoTitleZh, longTitle, longTitleZh, description, descriptionZh},
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
      if (mapping.kind !== 'plain') continue
      if (!mapping.enPath) continue
      collectFromValue(
        mapping.enPath,
        mapping.zhPath,
        doc,
        `${type}:${id}:${mapping.enPath}`,
        hits,
      )
    }
  }

  // Group by EN → ZH tallies
  const byEn = new Map<
    string,
    Map<string, {count: number; sources: string[]}>
  >()

  for (const hit of hits) {
    let zhMap = byEn.get(hit.en)
    if (!zhMap) {
      zhMap = new Map()
      byEn.set(hit.en, zhMap)
    }
    const row = zhMap.get(hit.zh) ?? {count: 0, sources: []}
    row.count += 1
    if (row.sources.length < 5) row.sources.push(hit.source)
    zhMap.set(hit.zh, row)
  }

  const winners: Array<{en: string; zh: string; count: number}> = []
  const conflicts: Array<{
    en: string
    variants: Array<{zh: string; count: number; sources: string[]}>
  }> = []

  for (const [en, zhMap] of byEn) {
    const variants = [...zhMap.entries()]
      .map(([zh, meta]) => ({zh, count: meta.count, sources: meta.sources}))
      .sort((a, b) => b.count - a.count)

    if (variants.length === 1) {
      winners.push({en, zh: variants[0]!.zh, count: variants[0]!.count})
      continue
    }

    // Clear majority (≥2× next) → winner; else conflict
    const top = variants[0]!
    const second = variants[1]!
    if (top.count >= second.count * 2 && top.count >= 2) {
      winners.push({en, zh: top.zh, count: top.count})
      conflicts.push({en, variants}) // still report for awareness
    } else {
      conflicts.push({en, variants})
    }
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), {recursive: true})
  fs.writeFileSync(
    CONFLICTS_PATH,
    JSON.stringify(
      {generatedAt: new Date().toISOString(), conflicts},
      null,
      2,
    ),
  )
  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        apply: APPLY,
        hitCount: hits.length,
        uniqueEn: byEn.size,
        winners: winners.length,
        conflictKeys: conflicts.length,
        sampleWinners: winners.slice(0, 30),
      },
      null,
      2,
    ),
  )

  console.log(`Hits: ${hits.length}`)
  console.log(`Unique EN: ${byEn.size}`)
  console.log(`Winners: ${winners.length}`)
  console.log(`Conflict keys: ${conflicts.length}`)
  console.log(`Report: ${REPORT_PATH}`)
  console.log(`Conflicts: ${CONFLICTS_PATH}`)

  if (!APPLY) {
    console.log('Dry-run only. Re-run with --apply to write phrases.')
    return
  }

  let created = 0
  let skipped = 0
  for (const row of winners) {
    const id = phraseDocumentId(row.en)
    const existing = await client.fetch<{zh?: string} | null>(
      `*[_type == "translatedPhrase" && _id == $id][0]{zh}`,
      {id},
    )
    if (existing) {
      skipped += 1
      continue
    }
    await client.createOrReplace({
      _id: id,
      _type: 'translatedPhrase',
      en: row.en,
      zh: row.zh,
    })
    created += 1
    if (created % 25 === 0) console.log(`Created ${created}…`)
  }

  console.log(`Done. Created ${created}, skipped existing ${skipped}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
