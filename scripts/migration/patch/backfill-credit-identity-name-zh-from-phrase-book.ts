/**
 * Backfill creditIdentity.nameZh from Phrase Book (translatedPhrase) — empty only.
 *
 * One-way: Phrase Book → identity. Never overwrites a non-empty nameZh.
 * Skips phrase ZH that equals the English name (low-value identity copies).
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/backfill-credit-identity-name-zh-from-phrase-book.ts
 *   npx tsx scripts/migration/patch/backfill-credit-identity-name-zh-from-phrase-book.ts --apply
 *
 * Expected live fillable count (investigation Sep 2026): 77.
 * If the live count differs, refuse --apply until re-reviewed.
 */

import {normalizePhraseKey} from '../../../shared/phrase-book'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

/** Investigation baseline — refuse apply if live count drifts. */
const EXPECTED_FILLABLE_COUNT = 77

/** Known-odd phrase ZH values to highlight in dry-run skim. */
const QUESTIONABLE_BY_EN = new Map<string, string>([
  ['MEXC', 'Mexico City calque — 墨西哥城'],
  ['Flex Films', '拓普酶 looks unrelated to Flex Films'],
  ['Farm Films South Africa', 'literal calque — 农场电影南非'],
  ['Floating Pictures', 'literal calque — 浮动图片'],
  ['Circus Digital', 'literal calque — 马戏数字'],
  ['Creativity Studio', 'literal calque — 创意工作室'],
  ['The Secret Little Agency', 'literal calque — 秘密小机构'],
  ['Mantis Film Fix', 'literal calque — 螳螂影业修补'],
])

type IdentityRow = {
  _id: string
  name?: string | null
  nameZh?: string | null
}

type PhraseRow = {
  _id: string
  en?: string | null
  zh?: string | null
}

type FillCandidate = {
  identityId: string
  name: string
  currentNameZh: string
  phraseId: string
  phraseZh: string
  questionable?: string
}

function isNameZhEmpty(value: string | null | undefined): boolean {
  return !normalizePhraseKey(value)
}

function flagQuestionable(en: string, zh: string): string | undefined {
  const known = QUESTIONABLE_BY_EN.get(en)
  if (known) return known
  // Heuristic: pure Han that looks like a literal geographic/descriptive gloss
  // of English words is often weak — still human-skim the full list.
  if (/墨西哥城|农场|浮动|马戏|创意工作室|秘密小|螳螂|拓普酶/.test(zh)) {
    return 'heuristic: review ZH against brand meaning'
  }
  return undefined
}

async function main() {
  const client = getWriteClient()

  const [identities, phrases] = await Promise.all([
    client.fetch<IdentityRow[]>(
      `*[_type == "creditIdentity" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
        _id, name, nameZh
      }`,
    ),
    client.fetch<PhraseRow[]>(
      `*[_type == "translatedPhrase" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && defined(zh) && zh != ""]{
        _id, en, zh
      }`,
    ),
  ])

  const phraseByEn = new Map<string, {id: string; en: string; zh: string}>()
  for (const phrase of phrases) {
    const en = normalizePhraseKey(phrase.en)
    const zh = normalizePhraseKey(phrase.zh)
    if (!en || !zh) continue
    // First wins — phrase book is one-per-EN by convention
    if (!phraseByEn.has(en)) {
      phraseByEn.set(en, {id: phrase._id, en, zh})
    }
  }

  const candidates: FillCandidate[] = []
  const skippedZhEqualsEn: Array<{name: string; zh: string}> = []
  const skippedAlreadyFilled: Array<{name: string; nameZh: string}> = []

  for (const identity of identities) {
    const name = normalizePhraseKey(identity.name)
    if (!name) continue

    const phrase = phraseByEn.get(name)
    if (!phrase) continue

    if (!isNameZhEmpty(identity.nameZh)) {
      skippedAlreadyFilled.push({
        name,
        nameZh: normalizePhraseKey(identity.nameZh),
      })
      continue
    }

    if (phrase.zh === name) {
      skippedZhEqualsEn.push({name, zh: phrase.zh})
      continue
    }

    candidates.push({
      identityId: identity._id,
      name,
      currentNameZh: '',
      phraseId: phrase.id,
      phraseZh: phrase.zh,
      questionable: flagQuestionable(name, phrase.zh),
    })
  }

  candidates.sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}))

  console.log('='.repeat(72))
  console.log(
    APPLY
      ? 'APPLY — backfill creditIdentity.nameZh from Phrase Book'
      : 'DRY RUN — backfill creditIdentity.nameZh from Phrase Book',
  )
  console.log('='.repeat(72))
  console.log(`Identities scanned: ${identities.length}`)
  console.log(`Phrases with ZH: ${phrases.length}`)
  console.log(`Fillable (empty nameZh, EN match, ZH≠EN): ${candidates.length}`)
  console.log(`Skipped ZH===EN: ${skippedZhEqualsEn.length}`)
  console.log(`Skipped already filled: ${skippedAlreadyFilled.length}`)
  console.log(`Expected fillable count: ${EXPECTED_FILLABLE_COUNT}`)
  console.log('')

  if (candidates.length !== EXPECTED_FILLABLE_COUNT) {
    console.error(
      `COUNT MISMATCH: got ${candidates.length}, expected ${EXPECTED_FILLABLE_COUNT}.`,
    )
    if (APPLY) {
      console.error('Refusing --apply until the list is re-reviewed.')
      process.exit(1)
    }
    console.error('Dry-run continues so the list can be reviewed.')
    console.log('')
  }

  const questionable = candidates.filter((c) => c.questionable)
  if (questionable.length) {
    console.log(`--- Questionable / skim carefully (${questionable.length}) ---`)
    for (const row of questionable) {
      console.log(
        `  ⚠ ${row.name}  →  ${row.phraseZh}  [${row.questionable}]  (${row.identityId})`,
      )
    }
    console.log('')
  }

  console.log(`--- Full fillable list (${candidates.length}) ---`)
  for (const [index, row] of candidates.entries()) {
    const mark = row.questionable ? ' ⚠' : ''
    console.log(
      `${String(index + 1).padStart(3, ' ')}. ${row.name}  →  ${row.phraseZh}${mark}`,
    )
    console.log(`     id=${row.identityId}  phrase=${row.phraseId}`)
  }
  console.log('')

  if (!APPLY) {
    console.log('Dry-run complete. Re-run with --apply after review to write nameZh.')
    return
  }

  let patched = 0
  let errors = 0
  for (const row of candidates) {
    try {
      const current = await client.fetch<string | null>(
        `*[_id == $id][0].nameZh`,
        {id: row.identityId},
      )
      if (!isNameZhEmpty(current)) {
        console.warn(
          `skip (nameZh already set): ${row.name} → "${normalizePhraseKey(current)}"`,
        )
        continue
      }
      await client.patch(row.identityId).set({nameZh: row.phraseZh}).commit()
      patched += 1
      console.log(`patched ${row.identityId}  ${row.name} → ${row.phraseZh}`)
    } catch (error) {
      errors += 1
      console.error(
        `ERROR ${row.identityId} ${row.name}:`,
        error instanceof Error ? error.message : error,
      )
    }
  }

  console.log('')
  console.log(`Apply complete. patched=${patched} errors=${errors}`)
  if (errors > 0 || patched !== candidates.length) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
