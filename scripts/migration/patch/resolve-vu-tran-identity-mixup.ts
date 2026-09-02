/**
 * Resolve Vu Tran / Tran Tuan Vu identity mix-up:
 * - Repoint 1 camera/camera_op slot from art-assistant identity to Tran Tuan Vu
 * - Link 6 unlinked production/1st_ad "Vu Tran" slots to Tran Tuan Vu
 * - Name-sync all 7 touched slots to canonical "Tran Tuan Vu"
 *
 * Does NOT touch: 4 art/art_assistant slots on Vu Tran identity, Tran Ha Vu on herbalife.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/resolve-vu-tran-identity-mixup.ts
 *   npx tsx scripts/migration/patch/resolve-vu-tran-identity-mixup.ts --apply
 */

import type {CrewCreditValue} from '../../../shared/crew-credits'
import {applyPersonRenameToCredits} from '../../../shared/crew-credits/rename-credits'
import {identityRef} from '../../../sanity/components/crew-credits/sync-credit-identities'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

const VU_TRAN_ART_IDENTITY_ID = 'ci_f191933ffe684bc184d5f5'
const TRAN_TUAN_VU_IDENTITY_ID = 'ci_7a5c129190f84d57a0da85'
const CANONICAL_NAME = 'Tran Tuan Vu'

type SlotAction = 'repoint' | 'link'

type TargetSlot = {
  slug: string
  department: string
  roleKey: string
  personKey: string
  action: SlotAction
  /** For link slots: exact crewPerson.name required. */
  expectedName?: string
}

/** personKeys re-confirmed via GROQ before patching (Sep 2026). */
const TARGET_SLOTS: TargetSlot[] = [
  {
    slug: 'realme-15-pro-5g',
    department: 'camera',
    roleKey: 'camera_op',
    personKey: 'm4xyjege8v',
    action: 'repoint',
  },
  {
    slug: 'mammotion-luba-automated-robot-lawn-mower',
    department: 'production',
    roleKey: '1st_ad',
    personKey: 'c2d5axec2e',
    action: 'link',
    expectedName: 'Vu Tran',
  },
  {
    slug: 'indwell-refrigerator-air-conditioner',
    department: 'production',
    roleKey: '1st_ad',
    personKey: 'h1xlksc6g1b',
    action: 'link',
    expectedName: 'Vu Tran',
  },
  {
    slug: 'bambu-lab-x1',
    department: 'production',
    roleKey: '1st_ad',
    personKey: 'mhpbhn250de',
    action: 'link',
    expectedName: 'Vu Tran',
  },
  {
    slug: 'bitget-elite-traders',
    department: 'production',
    roleKey: '1st_ad',
    personKey: 'lik9czbclve',
    action: 'link',
    expectedName: 'Vu Tran',
  },
  {
    slug: 'valerion-visionmaster-max-hollywood-grade-home-cinema-experience',
    department: 'production',
    roleKey: '1st_ad',
    personKey: 'obg4q94yrg',
    action: 'link',
    expectedName: 'Vu Tran',
  },
  {
    slug: 'msi-business-elevate-everyday-work',
    department: 'production',
    roleKey: '1st_ad',
    personKey: 'oq9005iqdok',
    action: 'link',
    expectedName: 'Vu Tran',
  },
]

const EXPECTED_SLOT_COUNT = 7

/** Art-assistant slots that must remain on Vu Tran identity — not in change set. */
const UNTOUCHED_ART_SLOTS: Array<{
  slug: string
  personKey: string
  roleKey: 'art_assistant'
}> = [
  {slug: 'bambu-lab-x1', personKey: '4jor9ec3kx3', roleKey: 'art_assistant'},
  {slug: 'insta360-link-the-ai-powered-4k-webcam', personKey: 'emzybiob3sk', roleKey: 'art_assistant'},
  {slug: 'techcombank-inspire-why-not', personKey: 'd29n1vixc17', roleKey: 'art_assistant'},
  {slug: 'xgimi-horizon-pro', personKey: 'wifu5f4yxy', roleKey: 'art_assistant'},
]

const UNTOUCHED_TRAN_HA_VU = {
  slug: 'herbalife-nutrition',
  department: 'production',
  roleKey: '1st_ad',
  personKey: 'm1w9409o3r',
  expectedName: 'Tran Ha Vu',
}

type PortfolioDoc = {
  _id: string
  slug?: string
  crewCredits?: CrewCreditValue[]
}

type ResolvedSlot = {
  slug: string
  documentId: string
  department: string
  roleKey: string
  personKey: string
  name: string
  action: SlotAction
  existingIdentityId?: string
}

function findSlot(doc: PortfolioDoc, target: TargetSlot): ResolvedSlot | null {
  for (const credit of doc.crewCredits ?? []) {
    if (credit.department !== target.department || credit.roleKey !== target.roleKey) continue
    for (const person of credit.people ?? []) {
      if (person._key !== target.personKey) continue
      const name = person.name?.trim()
      if (!name) return null
      return {
        slug: target.slug,
        documentId: doc._id,
        department: target.department,
        roleKey: target.roleKey,
        personKey: target.personKey,
        name,
        action: target.action,
        existingIdentityId: person.identity?._ref,
      }
    }
  }
  return null
}

function patchSlotCredits(
  credits: CrewCreditValue[] | undefined,
  slot: ResolvedSlot,
  identityId: string,
  canonicalName: string,
): CrewCreditValue[] {
  const withIdentity = (credits ?? []).map((credit) => {
    if (credit.department !== slot.department || credit.roleKey !== slot.roleKey) return credit
    const people = (credit.people ?? []).map((person) => {
      if (person._key !== slot.personKey) return person
      return {...person, identity: identityRef(identityId)}
    })
    return {...credit, people}
  })
  const {credits: renamed} = applyPersonRenameToCredits(withIdentity, {
    fromName: '',
    toName: canonicalName,
    identityId,
  })
  return renamed
}

async function fetchIdentitySlotCount(
  client: ReturnType<typeof getWriteClient>,
  identityId: string,
): Promise<Array<{slug: string; department: string; roleKey: string; personKey: string; name: string}>> {
  const docs = await client.fetch<
    Array<{
      slug?: string
      crewCredits?: Array<{
        department?: string
        roleKey?: string
        people?: Array<{_key?: string; name?: string} | null>
      }>
    }>
  >(
    `*[_type == "portfolioEntry" && !(_id in path("drafts.**"))]{
      "slug": slug.current,
      crewCredits[]{
        department,
        roleKey,
        people[identity._ref == $identityId]{
          _key,
          name
        }
      }
    }`,
    {identityId},
  )

  const slots: Array<{
    slug: string
    department: string
    roleKey: string
    personKey: string
    name: string
  }> = []

  for (const doc of docs ?? []) {
    for (const credit of doc.crewCredits ?? []) {
      for (const person of credit.people ?? []) {
        if (!person?._key) continue
        slots.push({
          slug: doc.slug ?? '(unknown)',
          department: credit.department ?? '?',
          roleKey: credit.roleKey ?? '?',
          personKey: person._key,
          name: person.name?.trim() ?? '',
        })
      }
    }
  }

  return slots
}

async function verifyUntouchedSlots(client: ReturnType<typeof getWriteClient>) {
  const slugs = [
    ...UNTOUCHED_ART_SLOTS.map((s) => s.slug),
    UNTOUCHED_TRAN_HA_VU.slug,
  ]
  const docs = await client.fetch<PortfolioDoc[]>(
    `*[_type == "portfolioEntry" && slug.current in $slugs && !(_id in path("drafts.**"))]{
      _id,
      "slug": slug.current,
      crewCredits
    }`,
    {slugs: [...new Set(slugs)]},
  )
  const bySlug = new Map((docs ?? []).map((doc) => [doc.slug, doc]))

  for (const art of UNTOUCHED_ART_SLOTS) {
    const doc = bySlug.get(art.slug)
    if (!doc) {
      throw new Error(`Missing portfolio for untouched art slot: ${art.slug}`)
    }
    let found = false
    for (const credit of doc.crewCredits ?? []) {
      if (credit.department !== 'art' || credit.roleKey !== art.roleKey) continue
      for (const person of credit.people ?? []) {
        if (person._key !== art.personKey) continue
        found = true
        if (person.identity?._ref !== VU_TRAN_ART_IDENTITY_ID) {
          throw new Error(
            `Untouched art slot ${art.slug}/${art.personKey} has identity ${person.identity?._ref ?? '(none)'}, expected ${VU_TRAN_ART_IDENTITY_ID}`,
          )
        }
      }
    }
    if (!found) {
      throw new Error(`Untouched art slot not found: ${art.slug} art/${art.roleKey} ${art.personKey}`)
    }
  }

  const herbalife = bySlug.get(UNTOUCHED_TRAN_HA_VU.slug)
  if (!herbalife) {
    throw new Error(`Missing portfolio for ${UNTOUCHED_TRAN_HA_VU.slug}`)
  }
  let tranHaFound = false
  for (const credit of herbalife.crewCredits ?? []) {
    if (
      credit.department !== UNTOUCHED_TRAN_HA_VU.department ||
      credit.roleKey !== UNTOUCHED_TRAN_HA_VU.roleKey
    ) {
      continue
    }
    for (const person of credit.people ?? []) {
      if (person._key !== UNTOUCHED_TRAN_HA_VU.personKey) continue
      tranHaFound = true
      if (person.name?.trim() !== UNTOUCHED_TRAN_HA_VU.expectedName) {
        throw new Error(
          `Tran Ha Vu slot name is "${person.name}", expected "${UNTOUCHED_TRAN_HA_VU.expectedName}"`,
        )
      }
      if (person.identity?._ref) {
        throw new Error(
          `Tran Ha Vu slot unexpectedly linked to ${person.identity._ref}`,
        )
      }
    }
  }
  if (!tranHaFound) {
    throw new Error('Tran Ha Vu slot not found on herbalife-nutrition')
  }
}

async function main() {
  const client = getWriteClient()
  console.log(`Mode: ${APPLY ? 'APPLY (live writes)' : 'DRY RUN ONLY'}`)

  const targetIdentity = await client.fetch<{_id: string; name?: string} | null>(
    `*[_type == "creditIdentity" && _id == $id][0]{_id, name}`,
    {id: TRAN_TUAN_VU_IDENTITY_ID},
  )
  if (!targetIdentity) {
    console.error(`Target identity not found: ${TRAN_TUAN_VU_IDENTITY_ID}`)
    process.exit(1)
  }
  if (targetIdentity.name?.trim() !== CANONICAL_NAME) {
    console.error(
      `Target identity name is "${targetIdentity.name}", expected "${CANONICAL_NAME}" — aborting (do not rename identity)`,
    )
    process.exit(1)
  }
  console.log(`Target identity: ${targetIdentity.name} (${targetIdentity._id})`)

  const beforeVuTran = await fetchIdentitySlotCount(client, VU_TRAN_ART_IDENTITY_ID)
  const beforeTranTuanVu = await fetchIdentitySlotCount(client, TRAN_TUAN_VU_IDENTITY_ID)
  console.log(`\nPre-flight used-by: Vu Tran identity=${beforeVuTran.length}, Tran Tuan Vu identity=${beforeTranTuanVu.length}`)

  await verifyUntouchedSlots(client)
  console.log('Untouched slots verified: 4 art_assistant + Tran Ha Vu (herbalife)')

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
        `Slot not found: ${target.slug} ${target.department}/${target.roleKey} personKey=${target.personKey}`,
      )
      process.exit(1)
    }

    if (target.action === 'repoint') {
      if (slot.existingIdentityId !== VU_TRAN_ART_IDENTITY_ID) {
        console.error(
          `Repoint slot ${target.slug} has identity ${slot.existingIdentityId ?? '(none)'}, expected ${VU_TRAN_ART_IDENTITY_ID}`,
        )
        process.exit(1)
      }
    } else {
      if (slot.existingIdentityId) {
        console.error(
          `Link slot ${target.slug} already linked to ${slot.existingIdentityId}`,
        )
        process.exit(1)
      }
      if (target.expectedName && slot.name !== target.expectedName) {
        console.error(
          `Link slot ${target.slug} name is "${slot.name}", expected exact "${target.expectedName}"`,
        )
        process.exit(1)
      }
    }

    resolved.push(slot)
  }

  console.log(`\nFound ${resolved.length} target slot(s):`)
  for (const slot of resolved) {
    console.log(
      `  • [${slot.action}] "${slot.name}" [${slot.department}/${slot.roleKey}] on ${slot.slug} ` +
        `personKey=${slot.personKey} identity=${slot.existingIdentityId ?? '(none)'} → ${TRAN_TUAN_VU_IDENTITY_ID} name→"${CANONICAL_NAME}"`,
    )
  }

  if (resolved.length !== EXPECTED_SLOT_COUNT) {
    console.error(`Expected ${EXPECTED_SLOT_COUNT} slots, found ${resolved.length}`)
    process.exit(1)
  }

  const repointCount = resolved.filter((s) => s.action === 'repoint').length
  const linkCount = resolved.filter((s) => s.action === 'link').length
  if (repointCount !== 1 || linkCount !== 6) {
    console.error(`Expected 1 repoint + 6 links, got ${repointCount} repoint + ${linkCount} links`)
    process.exit(1)
  }

  if (!APPLY) {
    console.log('\nDry-run complete. No portfolio patches written.')
    console.log(`Would repoint ${repointCount} slot and link ${linkCount} slots to ${TRAN_TUAN_VU_IDENTITY_ID}.`)
    return
  }

  console.log('\nApplying live writes...')
  let errors = 0

  for (const slot of resolved) {
    try {
      const doc = bySlug.get(slot.slug)!
      const nextCredits = patchSlotCredits(
        doc.crewCredits,
        slot,
        TRAN_TUAN_VU_IDENTITY_ID,
        CANONICAL_NAME,
      )
      await client
        .patch(slot.documentId)
        .set({crewCredits: nextCredits})
        .commit({returnDocuments: false})
      console.log(
        `PATCH ${slot.slug} — [${slot.action}] "${slot.name}" → ${TRAN_TUAN_VU_IDENTITY_ID} (name="${CANONICAL_NAME}")`,
      )
    } catch (error) {
      errors += 1
      console.error(`ERROR patching ${slot.slug}:`, error)
    }
  }

  if (errors > 0) {
    console.error(`\nApply failed with ${errors} error(s)`)
    process.exit(1)
  }

  console.log('\nPost-apply verification...')

  const afterVuTran = await fetchIdentitySlotCount(client, VU_TRAN_ART_IDENTITY_ID)
  const afterTranTuanVu = await fetchIdentitySlotCount(client, TRAN_TUAN_VU_IDENTITY_ID)

  console.log(`Vu Tran identity (${VU_TRAN_ART_IDENTITY_ID}): ${afterVuTran.length} slot(s)`)
  for (const row of afterVuTran) {
    console.log(`  • ${row.slug} ${row.department}/${row.roleKey} ${row.personKey} "${row.name}"`)
  }

  console.log(`Tran Tuan Vu identity (${TRAN_TUAN_VU_IDENTITY_ID}): ${afterTranTuanVu.length} slot(s)`)
  for (const row of afterTranTuanVu) {
    console.log(`  • ${row.slug} ${row.department}/${row.roleKey} ${row.personKey} "${row.name}"`)
  }

  if (afterVuTran.length !== 4) {
    console.error(`Expected Vu Tran identity to have 4 slots, found ${afterVuTran.length}`)
    process.exit(1)
  }
  if (afterTranTuanVu.length !== 8) {
    console.error(`Expected Tran Tuan Vu identity to have 8 slots, found ${afterTranTuanVu.length}`)
    process.exit(1)
  }

  const badNames = afterTranTuanVu.filter((row) =>
    resolved.some((s) => s.slug === row.slug && s.personKey === row.personKey) && row.name !== CANONICAL_NAME,
  )
  if (badNames.length) {
    console.error('Name-sync verification failed on touched slots:')
    for (const row of badNames) {
      console.error(`  • ${row.slug} "${row.name}"`)
    }
    process.exit(1)
  }

  await verifyUntouchedSlots(client)
  console.log('Tran Ha Vu + 4 art_assistant slots verified untouched')

  console.log('\nApply complete. 0 errors.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
