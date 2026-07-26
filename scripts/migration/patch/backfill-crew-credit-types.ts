/**
 * Restore missing `_type` on crewCredits / people array objects.
 *
 * Several migration rewrites projected crewCredits without `_type`, then
 * wrote them back with `.set({ crewCredits })`, stripping Sanity object types.
 * Studio needs `_type: "crewCredit"` / `"crewPerson"` to open those documents.
 *
 * Dry-run by default. Pass --apply to write patches.
 *
 * Usage:
 *   npx tsx scripts/migration/patch/backfill-crew-credit-types.ts
 *   npx tsx scripts/migration/patch/backfill-crew-credit-types.ts --apply
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local for --apply.
 */

import type {CrewCreditValue, CrewPersonValue} from '../../../shared/crew-credits'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

interface PortfolioDoc {
  _id: string
  title?: string
  slug?: string
  crewCredits?: CrewCreditValue[]
}

function ensureTypes(credits: CrewCreditValue[] | undefined): {
  next: CrewCreditValue[]
  creditTypesFixed: number
  personTypesFixed: number
  changed: boolean
} {
  if (!credits?.length) {
    return {next: credits ?? [], creditTypesFixed: 0, personTypesFixed: 0, changed: false}
  }

  let creditTypesFixed = 0
  let personTypesFixed = 0

  const next = credits.map((credit) => {
    let creditChanged = false
    let typedCredit = credit

    if (credit._type !== 'crewCredit') {
      typedCredit = {...credit, _type: 'crewCredit'}
      creditTypesFixed++
      creditChanged = true
    }

    const people = (typedCredit.people ?? []).map((person: CrewPersonValue) => {
      if (person._type === 'crewPerson') return person
      personTypesFixed++
      creditChanged = true
      return {...person, _type: 'crewPerson' as const}
    })

    if (!creditChanged && people === typedCredit.people) return typedCredit
    return {...typedCredit, people}
  })

  return {
    next,
    creditTypesFixed,
    personTypesFixed,
    changed: creditTypesFixed > 0 || personTypesFixed > 0,
  }
}

async function main() {
  const apply = process.argv.includes('--apply')
  const client = getWriteClient()

  console.log('=== Backfill crew credit _type values ===\n')
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`)

  const docs = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
      _id,
      title,
      "slug": slug.current,
      crewCredits[]{
        _key,
        _type,
        department,
        roleKey,
        role,
        isCustomRole,
        people[]{ _key, _type, name, url, linkTitle }
      }
    }
  `)

  let docsTouched = 0
  let creditTypesFixed = 0
  let personTypesFixed = 0

  for (const doc of docs) {
    const result = ensureTypes(doc.crewCredits)
    if (!result.changed) continue

    docsTouched++
    creditTypesFixed += result.creditTypesFixed
    personTypesFixed += result.personTypesFixed
    console.log(
      `${apply ? '✓' : '·'} ${doc.slug ?? doc._id} — credits:${result.creditTypesFixed} people:${result.personTypesFixed}`,
    )

    if (apply) {
      await client.patch(doc._id).set({crewCredits: result.next}).commit()
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Documents ${apply ? 'updated' : 'would update'}: ${docsTouched}`)
  console.log(`crewCredit _type values restored: ${creditTypesFixed}`)
  console.log(`crewPerson _type values restored: ${personTypesFixed}`)
  if (!apply) {
    console.log('\nRe-run with --apply to write patches.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
