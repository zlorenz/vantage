/**
 * Backfill crewPerson.name on slots left stale after creditIdentity merges.
 *
 * Scoped to the three merges already executed live (Sep 2026). Does NOT run a
 * site-wide name/identity mismatch sweep.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/sync-crew-person-names-after-merge.ts
 *   npx tsx scripts/migration/patch/sync-crew-person-names-after-merge.ts --apply
 */

import {syncCrewPersonNamesToIdentity} from '../../../shared/crew-credits/rename-credits'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

/** Only the three canonical identities from completed live merges. */
const MERGE_NAME_BACKFILL_TARGETS = [
  {
    canonicalId: 'ci_a66e13adf5564e129f1a68',
    canonicalName: 'Alex Gornostaev',
  },
  {
    canonicalId: 'ci_d152baf546ad4632afc98d',
    canonicalName: 'Grace Team Sound & Lighting',
  },
  {
    canonicalId: 'ci_a8851fca08ea4164aa9594',
    canonicalName: 'HKFilm',
  },
] as const

const EXPECTED_STALE_SLOT_COUNT = 5

async function countSiteWideNameMismatches(client: ReturnType<typeof getWriteClient>) {
  const docs = await client.fetch<
    Array<{
      _id: string
      slug?: string
      crewCredits?: Array<{
        department?: string
        roleKey?: string
        people?: Array<{name?: string; identity?: {_ref?: string}}>
      }>
    }>
  >(
    `*[_type == "portfolioEntry" && defined(crewCredits)]{
      _id,
      "slug": slug.current,
      crewCredits[]{
        department,
        roleKey,
        people[]{
          name,
          "identityName": identity->name,
          "identityId": identity._ref
        }
      }
    }`,
  )

  const mismatches: Array<{slug?: string; name?: string; identityName?: string}> = []
  for (const doc of docs ?? []) {
    for (const credit of doc.crewCredits ?? []) {
      for (const person of credit.people ?? []) {
        const name = person.name?.trim()
        const identityName = (person as {identityName?: string}).identityName?.trim()
        if (!name || !identityName || name === identityName) continue
        mismatches.push({slug: doc.slug, name, identityName})
      }
    }
  }
  return mismatches
}

async function main() {
  const client = getWriteClient()
  console.log(`Mode: ${APPLY ? 'APPLY (live writes)' : 'DRY RUN ONLY'}`)
  console.log(`Targets: ${MERGE_NAME_BACKFILL_TARGETS.length} canonical identities`)
  console.log(`Expected stale slots: ${EXPECTED_STALE_SLOT_COUNT}`)
  console.log('')

  const beforeMismatches = await countSiteWideNameMismatches(client)
  console.log(`Site-wide name != identity->name mismatches (before): ${beforeMismatches.length}`)

  let totalStale = 0
  let totalDocumentsUpdated = 0
  let totalPeopleUpdated = 0

  for (const target of MERGE_NAME_BACKFILL_TARGETS) {
    const result = await syncCrewPersonNamesToIdentity(
      client,
      target.canonicalId,
      target.canonicalName,
      {apply: APPLY},
    )

    console.log('')
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

    totalStale += result.staleSlots.length
    totalDocumentsUpdated += result.documentsUpdated
    totalPeopleUpdated += result.peopleUpdated
  }

  console.log('')
  console.log(`Total stale slots: ${totalStale}`)
  if (totalStale !== EXPECTED_STALE_SLOT_COUNT) {
    console.error(
      `STOP: expected exactly ${EXPECTED_STALE_SLOT_COUNT} stale slots, found ${totalStale}.`,
    )
    process.exit(1)
  }

  if (APPLY) {
    console.log(`Apply complete: documentsUpdated=${totalDocumentsUpdated}, peopleUpdated=${totalPeopleUpdated}`)

    const afterStale = []
    for (const target of MERGE_NAME_BACKFILL_TARGETS) {
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

  const afterMismatches = await countSiteWideNameMismatches(client)
  console.log(`Site-wide name != identity->name mismatches (after): ${afterMismatches.length}`)

  if (APPLY && afterMismatches.length !== beforeMismatches.length - EXPECTED_STALE_SLOT_COUNT) {
    console.error(
      'STOP: site-wide mismatch count changed unexpectedly. ' +
        `Before=${beforeMismatches.length}, after=${afterMismatches.length}, ` +
        `expected after=${beforeMismatches.length - EXPECTED_STALE_SLOT_COUNT}`,
    )
    process.exit(1)
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
