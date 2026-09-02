/**
 * Resolve all 378 Production review-queue slots after cross-department-exact apply.
 *
 * - 347 slots (22 names): link to existing identities with name-sync
 * - 31 slots (9 names): create new Production-only identities (one per name)
 *
 * Slot targets and personKeys re-confirmed via live GROQ before authoring
 * (production-review-slot-data.ts).
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/resolve-production-review-slots.ts
 *   npx tsx scripts/migration/patch/resolve-production-review-slots.ts --apply
 */

import type {CrewCreditValue} from '../../../shared/crew-credits'
import {applyPersonRenameToCredits} from '../../../shared/crew-credits/rename-credits'
import {
  identityRef,
  newCreditIdentityDoc,
} from '../../../sanity/components/crew-credits/sync-credit-identities'
import {getWriteClient} from '../lib/sanity-client'
import '../config'
import {
  CREATE_SLOT_TARGETS,
  FORBIDDEN_CANDIDATE_BY_CREATE_NAME,
  LINK_SLOT_TARGETS,
} from './production-review-slot-data'

const APPLY = process.argv.includes('--apply')
const DEPARTMENT = 'production' as const

const EXPECTED_LINK_SLOT_COUNT = 347
const EXPECTED_CREATE_SLOT_COUNT = 31
const EXPECTED_TOTAL_SLOT_COUNT = 378
const EXPECTED_NEW_IDENTITY_COUNT = 9

const FORBIDDEN_IDENTITY_IDS = new Set(Object.values(FORBIDDEN_CANDIDATE_BY_CREATE_NAME))

/** Apply forbidden-candidate guard only when creating new identities for CREATE-group names. */
function assertCreateIdentityNotForbidden(identityId: string, createName: string): void {
  const forbidden = FORBIDDEN_CANDIDATE_BY_CREATE_NAME[createName]
  if (forbidden && identityId === forbidden) {
    throw new Error(`Create identity ${identityId} matches forbidden candidate for "${createName}"`)
  }
}

type PortfolioDoc = {
  _id: string
  slug?: string
  crewCredits?: CrewCreditValue[]
}

type ResolvedLinkSlot = (typeof LINK_SLOT_TARGETS)[number] & {
  documentId: string
  name: string
  hadIdentity: boolean
}

type ResolvedCreateSlot = (typeof CREATE_SLOT_TARGETS)[number] & {
  documentId: string
  name: string
  hadIdentity: boolean
  identityNameKey: string
}

function findPostPerson(
  doc: PortfolioDoc,
  roleKey: string,
  personKey: string,
): {name: string; hadIdentity: boolean; existingIdentityId?: string} | null {
  for (const credit of doc.crewCredits ?? []) {
    if (credit.department !== DEPARTMENT || credit.roleKey !== roleKey) continue
    for (const person of credit.people ?? []) {
      if (person._key !== personKey) continue
      const name = person.name?.trim()
      if (!name) return null
      return {
        name,
        hadIdentity: Boolean(person.identity?._ref),
        existingIdentityId: person.identity?._ref,
      }
    }
  }
  return null
}

function patchSlotWithIdentity(
  credits: CrewCreditValue[] | undefined,
  roleKey: string,
  personKey: string,
  identityId: string,
  canonicalName?: string,
): CrewCreditValue[] {
  const withIdentity = (credits ?? []).map((credit) => {
    if (credit.department !== DEPARTMENT || credit.roleKey !== roleKey) return credit
    const people = (credit.people ?? []).map((person) => {
      if (person._key !== personKey) return person
      return {...person, identity: identityRef(identityId)}
    })
    return {...credit, people}
  })

  if (!canonicalName) return withIdentity

  const {credits: renamed} = applyPersonRenameToCredits(withIdentity, {
    fromName: '',
    toName: canonicalName,
    identityId,
  })
  return renamed
}

async function fetchCanonicalNames(
  client: ReturnType<typeof getWriteClient>,
  identityIds: string[],
): Promise<Map<string, string>> {
  const rows = await client.fetch<Array<{_id: string; name?: string}>>(
    `*[_type == "creditIdentity" && _id in $ids]{_id, name}`,
    {ids: [...new Set(identityIds)]},
  )
  const map = new Map<string, string>()
  for (const row of rows ?? []) {
    const name = row.name?.trim()
    if (name) map.set(row._id, name)
  }
  return map
}

async function main() {
  const client = getWriteClient()
  console.log(`Mode: ${APPLY ? 'APPLY (live writes)' : 'DRY RUN ONLY'}`)
  console.log(
    `Expected: ${EXPECTED_LINK_SLOT_COUNT} link + ${EXPECTED_CREATE_SLOT_COUNT} create = ${EXPECTED_TOTAL_SLOT_COUNT} slots, ${EXPECTED_NEW_IDENTITY_COUNT} new identities`,
  )
  console.log('')

  if (LINK_SLOT_TARGETS.length !== EXPECTED_LINK_SLOT_COUNT) {
    console.error(`LINK_SLOT_TARGETS length ${LINK_SLOT_TARGETS.length} !== ${EXPECTED_LINK_SLOT_COUNT}`)
    process.exit(1)
  }
  if (CREATE_SLOT_TARGETS.length !== EXPECTED_CREATE_SLOT_COUNT) {
    console.error(`CREATE_SLOT_TARGETS length ${CREATE_SLOT_TARGETS.length} !== ${EXPECTED_CREATE_SLOT_COUNT}`)
    process.exit(1)
  }

  const linkIdentityIds = [...new Set(LINK_SLOT_TARGETS.map((s) => s.identityId))]
  const canonicalNames = await fetchCanonicalNames(client, linkIdentityIds)
  for (const id of linkIdentityIds) {
    if (!canonicalNames.has(id)) {
      console.error(`Missing canonical name for link identity ${id}`)
      process.exit(1)
    }
  }

  const allSlugs = [
    ...new Set([
      ...LINK_SLOT_TARGETS.map((s) => s.slug),
      ...CREATE_SLOT_TARGETS.map((s) => s.slug),
    ]),
  ]
  const docs = await client.fetch<PortfolioDoc[]>(
    `*[_type == "portfolioEntry" && slug.current in $slugs && !(_id in path("drafts.**"))]{
      _id,
      "slug": slug.current,
      crewCredits
    }`,
    {slugs: allSlugs},
  )
  const bySlug = new Map((docs ?? []).map((doc) => [doc.slug, doc]))

  const resolvedLinks: ResolvedLinkSlot[] = []
  for (const target of LINK_SLOT_TARGETS) {
    const doc = bySlug.get(target.slug)
    if (!doc) {
      console.error(`Missing portfolio: ${target.slug}`)
      process.exit(1)
    }
    const person = findPostPerson(doc, target.roleKey, target.personKey)
    if (!person) {
      console.error(
        `Link slot not found: ${target.slug} production/${target.roleKey} personKey=${target.personKey}`,
      )
      process.exit(1)
    }
    if (person.name !== target.slotName) {
      console.error(
        `Link slot name drift: ${target.slug} expected "${target.slotName}" got "${person.name}"`,
      )
      process.exit(1)
    }
    if (person.hadIdentity) {
      console.error(`Link slot already linked: ${target.slug} → ${person.existingIdentityId}`)
      process.exit(1)
    }
    resolvedLinks.push({
      ...target,
      documentId: doc._id,
      name: person.name,
      hadIdentity: person.hadIdentity,
    })
  }

  const resolvedCreates: ResolvedCreateSlot[] = []
  for (const target of CREATE_SLOT_TARGETS) {
    const doc = bySlug.get(target.slug)
    if (!doc) {
      console.error(`Missing portfolio: ${target.slug}`)
      process.exit(1)
    }
    const person = findPostPerson(doc, target.roleKey, target.personKey)
    if (!person) {
      console.error(
        `Create slot not found: ${target.slug} production/${target.roleKey} personKey=${target.personKey}`,
      )
      process.exit(1)
    }
    if (person.name !== target.slotName) {
      console.error(
        `Create slot name drift: ${target.slug} expected "${target.slotName}" got "${person.name}"`,
      )
      process.exit(1)
    }
    if (person.hadIdentity) {
      console.error(`Create slot already linked: ${target.slug} → ${person.existingIdentityId}`)
      process.exit(1)
    }
    const forbidden = FORBIDDEN_CANDIDATE_BY_CREATE_NAME[target.slotName]
    if (!forbidden) {
      console.error(`No forbidden candidate ID for create name "${target.slotName}"`)
      process.exit(1)
    }
    resolvedCreates.push({
      ...target,
      documentId: doc._id,
      name: person.name,
      hadIdentity: person.hadIdentity,
      identityNameKey: target.slotName,
    })
  }

  const createNames = [...new Set(resolvedCreates.map((s) => s.identityNameKey))].sort()
  if (createNames.length !== EXPECTED_NEW_IDENTITY_COUNT) {
    console.error(`Expected ${EXPECTED_NEW_IDENTITY_COUNT} create names, got ${createNames.length}`)
    process.exit(1)
  }

  const newIdentities = createNames.map((name) => newCreditIdentityDoc(name))
  const identityIdByCreateName = new Map(
    newIdentities.map((doc) => [doc.name, doc._id] as const),
  )

  for (const doc of newIdentities) {
    assertCreateIdentityNotForbidden(doc._id, doc.name)
    if (FORBIDDEN_IDENTITY_IDS.has(doc._id)) {
      console.error(`New identity id collides with forbidden candidate: ${doc._id}`)
      process.exit(1)
    }
  }

  const linkByName = new Map<string, number>()
  for (const slot of resolvedLinks) {
    linkByName.set(slot.slotName, (linkByName.get(slot.slotName) ?? 0) + 1)
  }
  const createByName = new Map<string, number>()
  for (const slot of resolvedCreates) {
    createByName.set(slot.slotName, (createByName.get(slot.slotName) ?? 0) + 1)
  }

  console.log('LINK group by name:')
  for (const [name, count] of [...linkByName.entries()].sort((a, b) => b[1] - a[1])) {
    const id = LINK_SLOT_TARGETS.find((s) => s.slotName === name)?.identityId
    console.log(`  • ${count}× "${name}" → ${id}`)
  }
  console.log('')
  console.log('CREATE group by name:')
  for (const [name, count] of [...createByName.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(
      `  • ${count}× "${name}" → NEW (forbidden candidate ${FORBIDDEN_CANDIDATE_BY_CREATE_NAME[name]})`,
    )
  }
  console.log('')

  console.log(`All ${resolvedLinks.length + resolvedCreates.length} slots:`)
  for (const slot of resolvedLinks) {
    const canonical = canonicalNames.get(slot.identityId)!
    console.log(
      `  [link] "${slot.name}" production/${slot.roleKey} ${slot.slug} personKey=${slot.personKey} → ${slot.identityId} name→"${canonical}"`,
    )
  }
  for (const slot of resolvedCreates) {
    const newId = identityIdByCreateName.get(slot.identityNameKey)!
    console.log(
      `  [create] "${slot.name}" production/${slot.roleKey} ${slot.slug} personKey=${slot.personKey} → NEW ${newId}`,
    )
  }

  console.log(`\nWould CREATE ${newIdentities.length} creditIdentity document(s):`)
  for (const doc of newIdentities) {
    console.log(`  • ${doc.name} (${doc._id})`)
  }

  if (!APPLY) {
    console.log('\nDry-run complete. No creditIdentity documents created, no portfolio patches written.')
    return
  }

  console.log('\nApplying live writes...')
  let errors = 0

  for (const doc of newIdentities) {
    try {
      await client.createIfNotExists(doc)
      console.log(`CREATE ${doc.name} (${doc._id})`)
    } catch (error) {
      errors += 1
      console.error(`ERROR creating ${doc.name}:`, error)
    }
  }

  const patchedDocs = new Map<string, CrewCreditValue[]>()

  for (const slot of resolvedCreates) {
    const doc = bySlug.get(slot.slug)!
    const base = patchedDocs.get(slot.documentId) ?? doc.crewCredits
    const identityId = identityIdByCreateName.get(slot.identityNameKey)!
    patchedDocs.set(
      slot.documentId,
      patchSlotWithIdentity(base, slot.roleKey, slot.personKey, identityId, slot.name),
    )
  }

  for (const slot of resolvedLinks) {
    const doc = bySlug.get(slot.slug)!
    const base = patchedDocs.get(slot.documentId) ?? doc.crewCredits
    const canonical = canonicalNames.get(slot.identityId)!
    patchedDocs.set(
      slot.documentId,
      patchSlotWithIdentity(base, slot.roleKey, slot.personKey, slot.identityId, canonical),
    )
  }

  for (const [documentId, crewCredits] of patchedDocs) {
    const slug = [...bySlug.entries()].find(([, doc]) => doc._id === documentId)?.[0] ?? documentId
    try {
      await client.patch(documentId).set({crewCredits}).commit({returnDocuments: false})
      console.log(`PATCH ${slug} (${documentId})`)
    } catch (error) {
      errors += 1
      console.error(`ERROR patching ${slug}:`, error)
    }
  }

  if (errors > 0) {
    console.error(`\nApply failed with ${errors} error(s)`)
    process.exit(1)
  }

  const identityCount = await client.fetch<number>(`count(*[_type == "creditIdentity"])`)
  console.log(`\nApply complete. 0 errors. Live creditIdentity count: ${identityCount}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
