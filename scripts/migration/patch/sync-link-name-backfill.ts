/**
 * Backfill crewPerson.name on slots left stale after first-time identity linking
 * (identity ref attached but slot name not synced to canonical identity name).
 *
 * Scoped to exactly three canonical identities from Sep 2026 camera/art applies.
 * Does NOT run a site-wide name/identity mismatch sweep.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/sync-link-name-backfill.ts
 *   npx tsx scripts/migration/patch/sync-link-name-backfill.ts --apply
 */

import {syncCrewPersonNamesToIdentity} from '../../../shared/crew-credits/rename-credits'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

/** Only the three canonical identities from first-time link name-sync gap. */
const LINK_NAME_BACKFILL_TARGETS = [
  {
    canonicalId: 'ci_51ea00ef5efa4bba982798',
    canonicalName: 'Tung Bui',
  },
  {
    canonicalId: 'ci_1fe9f8a6e76a40d99faca2',
    canonicalName: 'Duy Vk',
  },
  {
    canonicalId: 'ci_e7dfff0aab0940bd97781c',
    canonicalName: 'Nguyen Thuy Thanh Truc',
  },
] as const

const EXPECTED_STALE_SLOT_COUNT = 18

/** Pre-existing mismatches that must NOT be touched by this scoped run. */
const EXCLUDED_VERIFICATION_SLOTS = [
  {slug: 'oppo-reno-7-pro-unlimited-mom-in-portrait', name: 'Lê Trường'},
  {slug: 'roborock-qrevo-s-essential-power-ultimate-convenience', name: 'Lê Trường'},
] as const

async function fetchExcludedSlotNames(client: ReturnType<typeof getWriteClient>) {
  const rows: Array<{slug?: string; name?: string}> = []
  for (const slot of EXCLUDED_VERIFICATION_SLOTS) {
    const doc = await client.fetch<{crewCredits?: Array<{people?: Array<{name?: string}>}>} | null>(
      `*[_type == "portfolioEntry" && slug.current == $slug][0]{
        crewCredits[]{people[]{name}}
      }`,
      {slug: slot.slug},
    )
    let found: string | undefined
    for (const credit of doc?.crewCredits ?? []) {
      for (const person of credit.people ?? []) {
        if (person.name === slot.name) {
          found = person.name
          break
        }
      }
      if (found) break
    }
    rows.push({slug: slot.slug, name: found ?? '(missing)'})
  }
  return rows
}

async function main() {
  const client = getWriteClient()
  console.log(`Mode: ${APPLY ? 'APPLY (live writes)' : 'DRY RUN ONLY'}`)
  console.log(`Targets: ${LINK_NAME_BACKFILL_TARGETS.length} canonical identities`)
  console.log(`Expected stale slots: ${EXPECTED_STALE_SLOT_COUNT}`)
  console.log('')

  const excludedBefore = await fetchExcludedSlotNames(client)
  console.log('Excluded slots (must remain unchanged):')
  for (const row of excludedBefore) {
    console.log(`  • ${row.slug}: "${row.name}"`)
  }
  console.log('')

  let totalStale = 0
  let totalDocumentsUpdated = 0
  let totalPeopleUpdated = 0

  for (const target of LINK_NAME_BACKFILL_TARGETS) {
    const result = await syncCrewPersonNamesToIdentity(
      client,
      target.canonicalId,
      target.canonicalName,
      {apply: APPLY},
    )

    console.log(`Canonical: ${target.canonicalName} (${target.canonicalId})`)
    console.log(`  Stale slots found: ${result.staleSlots.length}`)
    for (const slot of result.staleSlots) {
      console.log(
        `    • ${slot.documentId} ${slot.department ?? '?'}/${slot.roleKey ?? '?'} ` +
          `[${slot.personKey ?? '?'}] "${slot.fromName}" → "${target.canonicalName}"`,
      )
    }
    if (APPLY) {
      console.log(
        `  Patched: documents=${result.documentsUpdated}, people=${result.peopleUpdated}`,
      )
    }
    console.log('')

    totalStale += result.staleSlots.length
    totalDocumentsUpdated += result.documentsUpdated
    totalPeopleUpdated += result.peopleUpdated
  }

  console.log(`Total stale slots: ${totalStale}`)
  if (totalStale === 0) {
    console.log('No stale slots — all target identities already synced.')
  } else if (totalStale !== EXPECTED_STALE_SLOT_COUNT) {
    console.error(
      `STOP: expected exactly ${EXPECTED_STALE_SLOT_COUNT} stale slots, found ${totalStale}.`,
    )
    process.exit(1)
  }

  if (APPLY) {
    console.log(`Apply complete: documentsUpdated=${totalDocumentsUpdated}, peopleUpdated=${totalPeopleUpdated}`)

    const afterStale = []
    for (const target of LINK_NAME_BACKFILL_TARGETS) {
      const verify = await syncCrewPersonNamesToIdentity(
        client,
        target.canonicalId,
        target.canonicalName,
      )
      afterStale.push(...verify.staleSlots)
    }
    if (afterStale.length) {
      console.error(`Verification failed: ${afterStale.length} stale slot(s) remain`)
      process.exit(1)
    }
    console.log('Post-apply verification: 0 stale slots for backfill targets')
  }

  const excludedAfter = APPLY ? await fetchExcludedSlotNames(client) : excludedBefore
  if (APPLY) {
    for (let i = 0; i < EXCLUDED_VERIFICATION_SLOTS.length; i++) {
      const before = excludedBefore[i]
      const after = excludedAfter[i]
      if (before?.name !== after?.name) {
        console.error(
          `STOP: excluded slot "${EXCLUDED_VERIFICATION_SLOTS[i]?.slug}" changed: ` +
            `"${before?.name}" → "${after?.name}"`,
        )
        process.exit(1)
      }
    }
    console.log('Excluded Lê Trường slots verified unchanged')
  }

  if (!APPLY) {
    console.log('')
    console.log('Dry-run complete. No portfolio patches written.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
