/**
 * Backfill creditIdentity.nameZh from Phrase Book — empty fields only.
 *
 * Scoped to an explicit allowlist of verified Chinese-market brand names
 * (Zach review Sep 2026). All other phrase-book matches are skipped.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/backfill-credit-identity-name-zh-from-phrase-book.ts
 *   npx tsx scripts/migration/patch/backfill-credit-identity-name-zh-from-phrase-book.ts --apply
 *
 * Expected live fillable count: 28. Refuse --apply if count or ZH drifts.
 */

import {normalizePhraseKey} from '../../../shared/phrase-book'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

/**
 * Approved EN → expected ZH. Only these identities are patched.
 * ZH must match the live Phrase Book value exactly (after normalizePhraseKey).
 */
const APPROVED_FILLS: ReadonlyArray<{en: string; zh: string}> = [
  {en: 'ASICS', zh: '亚瑟士'},
  {en: 'ASUS', zh: '华硕'},
  {en: 'Bambu Lab', zh: '拓竹'},
  {en: 'Coca-Cola', zh: '可口可乐'},
  {en: 'DJI', zh: '大疆'},
  {en: 'EcoFlow', zh: '正浩'},
  {en: 'Fujifilm', zh: '富士胶片'},
  {en: 'Hasselblad', zh: '哈苏'},
  {en: 'Herbalife Nutrition', zh: '康宝莱营养品'},
  {en: 'Huawei', zh: '华为'},
  {en: 'Hyundai', zh: '现代汽车'},
  {en: 'Insta360', zh: '影石Insta360'},
  {en: "Lay's", zh: '乐事'},
  {en: 'Jackery', zh: '电小二'},
  {en: 'Leo Burnett', zh: '李奥贝纳'},
  {en: 'Mammotion', zh: '库犸科技'},
  {en: 'Marvel', zh: '漫威'},
  {en: 'Ogilvy', zh: '奥美'},
  {en: 'OnePlus', zh: '一加'},
  {en: 'Petkit', zh: '小佩'},
  {en: 'Roborock', zh: '石头科技'},
  {en: 'Samsung', zh: '三星'},
  {en: 'Taiwan Excellence', zh: '台湾精品'},
  {en: 'Toyota', zh: '丰田汽车'},
  {en: 'Unilever', zh: '联合利华'},
  {en: 'Westin Hotels & Resorts', zh: '威斯汀酒店及度假村'},
  {en: 'XGIMI', zh: '极米'},
  {en: 'Zhiyun', zh: '智云'},
]

const EXPECTED_FILLABLE_COUNT = APPROVED_FILLS.length

const APPROVED_BY_EN = new Map(
  APPROVED_FILLS.map((row) => [normalizePhraseKey(row.en), normalizePhraseKey(row.zh)]),
)

/** Spot-check exclusions after apply — must remain empty nameZh. */
const EXCLUSION_SPOT_CHECKS = [
  'Old Spice',
  'P&G',
  'Cheil',
  'Vinamilk',
  'Byron McKenzie',
] as const

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
  phraseId: string
  phraseZh: string
  expectedZh: string
}

function isNameZhEmpty(value: string | null | undefined): boolean {
  return !normalizePhraseKey(value)
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
    if (!phraseByEn.has(en)) {
      phraseByEn.set(en, {id: phrase._id, en, zh})
    }
  }

  const candidates: FillCandidate[] = []
  const zhMismatches: Array<{name: string; expected: string; phraseZh: string}> = []
  const missingPhrase: string[] = []
  const missingIdentity: string[] = []
  const skippedAlreadyFilled: Array<{name: string; nameZh: string}> = []

  // Walk allowlist order so dry-run matches the approved list.
  for (const approved of APPROVED_FILLS) {
    const en = normalizePhraseKey(approved.en)
    const expectedZh = APPROVED_BY_EN.get(en)!
    const phrase = phraseByEn.get(en)
    if (!phrase) {
      missingPhrase.push(en)
      continue
    }
    if (phrase.zh !== expectedZh) {
      zhMismatches.push({name: en, expected: expectedZh, phraseZh: phrase.zh})
      continue
    }

    const matches = identities.filter(
      (identity) => normalizePhraseKey(identity.name) === en,
    )
    if (matches.length === 0) {
      missingIdentity.push(en)
      continue
    }
    for (const identity of matches) {
      if (!isNameZhEmpty(identity.nameZh)) {
        skippedAlreadyFilled.push({
          name: en,
          nameZh: normalizePhraseKey(identity.nameZh),
        })
        continue
      }
      candidates.push({
        identityId: identity._id,
        name: en,
        phraseId: phrase.id,
        phraseZh: phrase.zh,
        expectedZh,
      })
    }
  }

  candidates.sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}))

  console.log('='.repeat(72))
  console.log(
    APPLY
      ? 'APPLY — scoped creditIdentity.nameZh backfill (allowlist)'
      : 'DRY RUN — scoped creditIdentity.nameZh backfill (allowlist)',
  )
  console.log('='.repeat(72))
  console.log(`Allowlist size: ${APPROVED_FILLS.length}`)
  console.log(`Identities scanned: ${identities.length}`)
  console.log(`Fillable candidates: ${candidates.length}`)
  console.log(`Expected fillable count: ${EXPECTED_FILLABLE_COUNT}`)
  console.log(`Missing phrase: ${missingPhrase.length}`)
  console.log(`Missing identity: ${missingIdentity.length}`)
  console.log(`ZH mismatches vs allowlist: ${zhMismatches.length}`)
  console.log(`Skipped already filled: ${skippedAlreadyFilled.length}`)
  console.log('')

  if (missingPhrase.length) {
    console.error('Missing Phrase Book entries:', missingPhrase.join(', '))
  }
  if (missingIdentity.length) {
    console.error('Missing creditIdentity docs:', missingIdentity.join(', '))
  }
  if (zhMismatches.length) {
    console.error('ZH mismatches (allowlist vs live Phrase Book):')
    for (const row of zhMismatches) {
      console.error(`  ${row.name}: expected "${row.expected}" got "${row.phraseZh}"`)
    }
  }
  if (skippedAlreadyFilled.length) {
    console.error('Already filled (unexpected before first apply):')
    for (const row of skippedAlreadyFilled) {
      console.error(`  ${row.name}: "${row.nameZh}"`)
    }
  }

  const blockers =
    missingPhrase.length +
    missingIdentity.length +
    zhMismatches.length +
    (candidates.length !== EXPECTED_FILLABLE_COUNT ? 1 : 0)

  if (blockers > 0) {
    console.error('')
    console.error(
      `STOP: blockers=${blockers} (count=${candidates.length}, expected=${EXPECTED_FILLABLE_COUNT}).`,
    )
    if (APPLY) {
      console.error('Refusing --apply.')
      process.exit(1)
    }
  }

  console.log(`--- Allowlisted fillable list (${candidates.length}) ---`)
  for (const [index, row] of candidates.entries()) {
    console.log(
      `${String(index + 1).padStart(2, ' ')}. ${row.name}  →  ${row.phraseZh}`,
    )
    console.log(`    id=${row.identityId}  phrase=${row.phraseId}`)
  }
  console.log('')

  if (!APPLY) {
    console.log('Dry-run complete. Re-run with --apply after backup to write nameZh.')
    if (blockers > 0) process.exit(1)
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

  // Post-apply: exclusions still empty
  const exclusionRows = await client.fetch<IdentityRow[]>(
    `*[_type == "creditIdentity" && name in $names && !(_id in path("drafts.**"))]{_id, name, nameZh}`,
    {names: [...EXCLUSION_SPOT_CHECKS]},
  )
  console.log('--- Exclusion spot-check (must stay empty nameZh) ---')
  for (const name of EXCLUSION_SPOT_CHECKS) {
    const row = exclusionRows.find((r) => normalizePhraseKey(r.name) === name)
    if (!row) {
      console.log(`  ${name}: (no identity found)`)
      continue
    }
    const zh = normalizePhraseKey(row.nameZh)
    console.log(`  ${name}: nameZh=${zh ? JSON.stringify(zh) : '(empty)'}  ${zh ? 'FAIL' : 'ok'}`)
    if (zh) errors += 1
  }

  // Idempotency: no remaining allowlisted empties
  const remaining = await client.fetch<Array<{name: string}>>(
    `*[_type == "creditIdentity" && !(_id in path("drafts.**")) && name in $names && (!defined(nameZh) || nameZh == "")]{name}`,
    {names: APPROVED_FILLS.map((r) => r.en)},
  )
  console.log(
    `Remaining allowlisted empties: ${remaining.length}${remaining.length ? ` (${remaining.map((r) => r.name).join(', ')})` : ''}`,
  )

  if (errors > 0 || patched !== EXPECTED_FILLABLE_COUNT || remaining.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
