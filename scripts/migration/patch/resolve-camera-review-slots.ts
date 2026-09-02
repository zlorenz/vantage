/**
 * Resolve the 3 remaining Camera review-queue slots by creating dedicated
 * identities (not linking to flagged cross-department candidates).
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/resolve-camera-review-slots.ts
 *   npx tsx scripts/migration/patch/resolve-camera-review-slots.ts --apply
 */

import type {CrewCreditValue} from '../../../shared/crew-credits'
import {
  identityRef,
  newCreditIdentityDoc,
} from '../../../sanity/components/crew-credits/sync-credit-identities'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

/** Flagged candidates — must NOT receive these refs. */
const FORBIDDEN_IDENTITY_IDS = new Set([
  'ci_dd7901a02c26448b8e87be', // Le Thanh Tung (Stills)
  'ci_7b5f6ee35e6a4aabb0bb0c', // Nhan Nguyen (G&E)
])

type TargetSlot = {
  slug: string
  roleKey: string
  personKey: string
  identityNameKey: 'le_thanh_tung' | 'nhan_nguyen'
}

const TARGET_SLOTS: TargetSlot[] = [
  {
    slug: 'herbalife-nutrition',
    roleKey: 'steadicam_op',
    personKey: '7xtu4w7bqsr',
    identityNameKey: 'le_thanh_tung',
  },
  {
    slug: 'govee-halloween',
    roleKey: 'steadicam_op',
    personKey: '9ttfhy0znjq',
    identityNameKey: 'le_thanh_tung',
  },
  {
    slug: 'realme-15-pro-5g',
    roleKey: 'focus_puller',
    personKey: '1vujg0ocbpn',
    identityNameKey: 'nhan_nguyen',
  },
]

const EXPECTED_SLOT_COUNT = 3
const EXPECTED_NEW_IDENTITY_COUNT = 2

type PortfolioDoc = {
  _id: string
  slug?: string
  crewCredits?: CrewCreditValue[]
}

type ResolvedSlot = {
  slug: string
  documentId: string
  roleKey: string
  personKey: string
  name: string
  url?: string
  identityNameKey: TargetSlot['identityNameKey']
  hadIdentity: boolean
  existingIdentityId?: string
}

function findSlot(doc: PortfolioDoc, target: TargetSlot): ResolvedSlot | null {
  for (const credit of doc.crewCredits ?? []) {
    if (credit.department !== 'camera' || credit.roleKey !== target.roleKey) continue
    for (const person of credit.people ?? []) {
      if (person._key !== target.personKey) continue
      const name = person.name?.trim()
      if (!name) return null
      return {
        slug: target.slug,
        documentId: doc._id,
        roleKey: target.roleKey,
        personKey: target.personKey,
        name,
        url: person.url?.trim() || undefined,
        identityNameKey: target.identityNameKey,
        hadIdentity: Boolean(person.identity?._ref),
        existingIdentityId: person.identity?._ref,
      }
    }
  }
  return null
}

function patchCreditsWithIdentity(
  credits: CrewCreditValue[] | undefined,
  slot: ResolvedSlot,
  identityId: string,
): CrewCreditValue[] {
  return (credits ?? []).map((credit) => {
    if (credit.department !== 'camera' || credit.roleKey !== slot.roleKey) return credit
    const people = (credit.people ?? []).map((person) => {
      if (person._key !== slot.personKey) return person
      return {...person, identity: identityRef(identityId)}
    })
    return {...credit, people}
  })
}

async function main() {
  const client = getWriteClient()
  console.log(`Mode: ${APPLY ? 'APPLY (live writes)' : 'DRY RUN ONLY'}`)

  const docs = await client.fetch<PortfolioDoc[]>(
    `*[_type == "portfolioEntry" && slug.current in $slugs && !(_id in path("drafts.**"))]{
      _id,
      "slug": slug.current,
      crewCredits
    }`,
    {slugs: TARGET_SLOTS.map((slot) => slot.slug)},
  )

  const bySlug = new Map((docs ?? []).map((doc) => [doc.slug, doc]))
  const resolved: ResolvedSlot[] = []

  for (const target of TARGET_SLOTS) {
    const doc = bySlug.get(target.slug)
    if (!doc) {
      console.error(`Missing portfolio for slug: ${target.slug}`)
      process.exit(1)
    }
    const slot = findSlot(doc, target)
    if (!slot) {
      console.error(
        `Slot not found: ${target.slug} camera/${target.roleKey} personKey=${target.personKey}`,
      )
      process.exit(1)
    }
    resolved.push(slot)
  }

  console.log(`\nFound ${resolved.length} target slot(s):`)
  for (const slot of resolved) {
    console.log(
      `  • "${slot.name}" [camera/${slot.roleKey}] on ${slot.slug} (${slot.documentId}) ` +
        `personKey=${slot.personKey} identity=${slot.existingIdentityId ?? '(none)'}`,
    )
  }

  if (resolved.length !== EXPECTED_SLOT_COUNT) {
    console.error(`Expected ${EXPECTED_SLOT_COUNT} slots, found ${resolved.length}`)
    process.exit(1)
  }

  const leThanhName = resolved.find((s) => s.identityNameKey === 'le_thanh_tung')!.name
  const nhanName = resolved.find((s) => s.identityNameKey === 'nhan_nguyen')!.name

  const leThanhSlots = resolved.filter((s) => s.identityNameKey === 'le_thanh_tung')
  const nhanSlots = resolved.filter((s) => s.identityNameKey === 'nhan_nguyen')

  if (leThanhSlots.length !== 2 || nhanSlots.length !== 1) {
    console.error('Unexpected slot grouping for new identities')
    process.exit(1)
  }

  if (!leThanhSlots.every((s) => s.name === leThanhName)) {
    console.error('Lê Thanh Tùng slot spellings differ — aborting')
    process.exit(1)
  }

  const leThanhDoc = newCreditIdentityDoc(leThanhName)
  const nhanDoc = newCreditIdentityDoc(nhanName)
  const newIdentities = [leThanhDoc, nhanDoc]

  console.log(`\nWould CREATE ${newIdentities.length} creditIdentity document(s):`)
  for (const doc of newIdentities) {
    console.log(`  • ${doc.name} (${doc._id})`)
  }

  if (newIdentities.length !== EXPECTED_NEW_IDENTITY_COUNT) {
    console.error(`Expected ${EXPECTED_NEW_IDENTITY_COUNT} new identities`)
    process.exit(1)
  }

  const identityIdByKey: Record<TargetSlot['identityNameKey'], string> = {
    le_thanh_tung: leThanhDoc._id,
    nhan_nguyen: nhanDoc._id,
  }

  console.log('\nWould PATCH portfolio crewCredits:')
  for (const slot of resolved) {
    const identityId = identityIdByKey[slot.identityNameKey]
    console.log(
      `  • ${slot.slug} — "${slot.name}" → ${identityId}` +
        (FORBIDDEN_IDENTITY_IDS.has(identityId) ? ' *** FORBIDDEN ***' : ''),
    )
  }

  const alreadyLinked = resolved.filter((s) => s.hadIdentity)
  if (alreadyLinked.length) {
    console.error(
      `\n${alreadyLinked.length} slot(s) already have identity refs — aborting to avoid double-apply:`,
    )
    for (const slot of alreadyLinked) {
      console.error(`  • ${slot.slug} → ${slot.existingIdentityId}`)
    }
    process.exit(1)
  }

  if (!APPLY) {
    console.log('\nDry-run complete. No creditIdentity documents created, no portfolio patches written.')
    return
  }

  console.log('\nApplying live writes...')
  for (const doc of newIdentities) {
    await client.createIfNotExists(doc)
    console.log(`CREATE ${doc.name} (${doc._id})`)
  }

  for (const slot of resolved) {
    const doc = bySlug.get(slot.slug)!
    const identityId = identityIdByKey[slot.identityNameKey]
    const nextCredits = patchCreditsWithIdentity(doc.crewCredits, slot, identityId)
    await client.patch(slot.documentId).set({crewCredits: nextCredits}).commit({returnDocuments: false})
    console.log(`PATCH ${slot.slug} — "${slot.name}" → ${identityId}`)
  }

  const identityCount = await client.fetch<number>(`count(*[_type == "creditIdentity"])`)
  console.log(`\nApply complete. Live creditIdentity count: ${identityCount}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
