/**
 * Split Casting "Alex" (ci_f401ceff0f834606818caf) into two identities —
 * BRINC Guardian Talent and Govee Talent are different people wrongly merged
 * at the original Casting apply (pre confidence-gating).
 *
 * Does NOT touch Post Alex (ci_ea16b88fea334e56b7fb1a / YouTube Shopping).
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/resolve-alex-casting-identity-split.ts
 *   npx tsx scripts/migration/patch/resolve-alex-casting-identity-split.ts --apply
 */

import type {CrewCreditValue} from '../../../shared/crew-credits'
import {applyPersonRenameToCredits} from '../../../shared/crew-credits/rename-credits'
import {
  identityRef,
  newCreditIdentityDoc,
} from '../../../sanity/components/crew-credits/sync-credit-identities'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

const MERGED_CASTING_ALEX_ID = 'ci_f401ceff0f834606818caf'
const POST_ALEX_ID = 'ci_ea16b88fea334e56b7fb1a'
const CANONICAL_NAME = 'Alex'

type TargetSlot = {
  label: 'brinc' | 'govee'
  slug: string
  department: 'casting'
  roleKey: 'talent'
  personKey: string
  creditKey: string
}

/** personKeys / creditKeys re-confirmed via GROQ before patching (Sep 2026). */
const TARGET_SLOTS: TargetSlot[] = [
  {
    label: 'brinc',
    slug: 'brinc-guardian-next-generation-of-response',
    department: 'casting',
    roleKey: 'talent',
    personKey: 'n5z64hizdq',
    creditKey: '12n1tamqcc4n',
  },
  {
    label: 'govee',
    slug: 'govee-for-every-mood-of-home',
    department: 'casting',
    roleKey: 'talent',
    personKey: 'syjhzb7tbuf',
    creditKey: '01ef4woza7ir',
  },
]

const EXPECTED_SLOT_COUNT = 2

type PortfolioDoc = {
  _id: string
  slug?: string
  title?: string
  crewCredits?: CrewCreditValue[]
}

type ResolvedSlot = {
  label: TargetSlot['label']
  slug: string
  documentId: string
  title: string
  department: string
  roleKey: string
  personKey: string
  creditKey: string
  name: string
  existingIdentityId?: string
}

function findSlot(doc: PortfolioDoc, target: TargetSlot): ResolvedSlot | null {
  for (const credit of doc.crewCredits ?? []) {
    if (credit.department !== target.department || credit.roleKey !== target.roleKey) {
      continue
    }
    if (credit._key !== target.creditKey) continue
    for (const person of credit.people ?? []) {
      if (person._key !== target.personKey) continue
      const name = person.name?.trim()
      if (!name) return null
      return {
        label: target.label,
        slug: target.slug,
        documentId: doc._id,
        title: doc.title?.trim() || target.slug,
        department: target.department,
        roleKey: target.roleKey,
        personKey: target.personKey,
        creditKey: target.creditKey,
        name,
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
    if (credit._key !== slot.creditKey) return credit
    if (credit.department !== slot.department || credit.roleKey !== slot.roleKey) {
      return credit
    }
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

async function main() {
  const client = getWriteClient()
  console.log(`Mode: ${APPLY ? 'APPLY (live writes)' : 'DRY RUN ONLY'}`)
  console.log(`Merged Casting Alex to split: ${MERGED_CASTING_ALEX_ID}`)
  console.log(`Post Alex (must remain untouched): ${POST_ALEX_ID}`)

  const [merged, postAlex, preAlexCount, preRefCount] = await Promise.all([
    client.fetch<{_id: string; name?: string} | null>(
      `*[_type == "creditIdentity" && _id == $id][0]{_id, name}`,
      {id: MERGED_CASTING_ALEX_ID},
    ),
    client.fetch<{_id: string; name?: string} | null>(
      `*[_type == "creditIdentity" && _id == $id][0]{_id, name}`,
      {id: POST_ALEX_ID},
    ),
    client.fetch<number>(
      `count(*[_type == "creditIdentity" && name == $name && !(_id in path("drafts.**"))])`,
      {name: CANONICAL_NAME},
    ),
    client.fetch<number>(`count(*[references($id)])`, {id: MERGED_CASTING_ALEX_ID}),
  ])

  if (!merged) {
    console.error(`Merged Casting Alex not found: ${MERGED_CASTING_ALEX_ID}`)
    process.exit(1)
  }
  if (merged.name?.trim() !== CANONICAL_NAME) {
    console.error(`Merged identity name is "${merged.name}", expected "${CANONICAL_NAME}"`)
    process.exit(1)
  }
  if (!postAlex) {
    console.error(`Post Alex not found: ${POST_ALEX_ID}`)
    process.exit(1)
  }
  if (postAlex.name?.trim() !== CANONICAL_NAME) {
    console.error(`Post Alex name is "${postAlex.name}", expected "${CANONICAL_NAME}"`)
    process.exit(1)
  }
  if (preRefCount !== EXPECTED_SLOT_COUNT) {
    console.error(
      `Merged Casting Alex has ${preRefCount} references, expected ${EXPECTED_SLOT_COUNT}`,
    )
    process.exit(1)
  }
  console.log(`Pre-flight: ${preAlexCount} creditIdentity docs named "Alex"; merged refs=${preRefCount}`)

  const postPortfolio = await client.fetch<{
    _id: string
    crewCredits?: CrewCreditValue[]
  } | null>(
    `*[_type == "portfolioEntry" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
      _id,
      crewCredits
    }`,
    {slug: 'youtube-shopping-reason-to-believe'},
  )
  let postSlotOk = false
  for (const credit of postPortfolio?.crewCredits ?? []) {
    if (credit.department !== 'post' || credit.roleKey !== 'motion_graphics') continue
    for (const person of credit.people ?? []) {
      if (person._key !== '00oceyquckz9') continue
      postSlotOk = person.identity?._ref === POST_ALEX_ID
      if (!postSlotOk) {
        console.error(
          `Post Alex YouTube Shopping slot identity is ${person.identity?._ref ?? '(none)'}, expected ${POST_ALEX_ID}`,
        )
        process.exit(1)
      }
      console.log(
        `Post Alex untouched check (pre): youtube-shopping-reason-to-believe personKey=${person._key} → ${person.identity?._ref}`,
      )
    }
  }
  if (!postSlotOk) {
    console.error('Post Alex YouTube Shopping slot missing — aborting')
    process.exit(1)
  }

  const docs = await client.fetch<PortfolioDoc[]>(
    `*[_type == "portfolioEntry" && slug.current in $slugs && !(_id in path("drafts.**"))]{
      _id,
      title,
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
        `Slot not found: ${target.slug} ${target.department}/${target.roleKey} ` +
          `creditKey=${target.creditKey} personKey=${target.personKey}`,
      )
      process.exit(1)
    }
    if (slot.existingIdentityId !== MERGED_CASTING_ALEX_ID) {
      console.error(
        `Slot ${target.slug} has identity ${slot.existingIdentityId ?? '(none)'}, ` +
          `expected ${MERGED_CASTING_ALEX_ID}`,
      )
      process.exit(1)
    }
    if (slot.name !== CANONICAL_NAME) {
      console.error(`Slot ${target.slug} name is "${slot.name}", expected "${CANONICAL_NAME}"`)
      process.exit(1)
    }
    if (slot.existingIdentityId === POST_ALEX_ID) {
      console.error(`Slot ${target.slug} unexpectedly points at Post Alex — aborting`)
      process.exit(1)
    }
    resolved.push(slot)
  }

  if (resolved.length !== EXPECTED_SLOT_COUNT) {
    console.error(`Expected ${EXPECTED_SLOT_COUNT} slots, found ${resolved.length}`)
    process.exit(1)
  }

  const brincDoc = newCreditIdentityDoc(CANONICAL_NAME)
  const goveeDoc = newCreditIdentityDoc(CANONICAL_NAME)
  const identityByLabel: Record<TargetSlot['label'], string> = {
    brinc: brincDoc._id,
    govee: goveeDoc._id,
  }

  console.log(`\nFound ${resolved.length} target slot(s):`)
  for (const slot of resolved) {
    const nextId = identityByLabel[slot.label]
    console.log(
      `  • [${slot.label}] "${slot.name}" [${slot.department}/${slot.roleKey}] on ${slot.slug} ` +
        `(${slot.title}) creditKey=${slot.creditKey} personKey=${slot.personKey} ` +
        `${slot.existingIdentityId} → NEW ${nextId}`,
    )
  }

  console.log(`\nWould CREATE 2 creditIdentity documents:`)
  console.log(`  • BRINC Alex ${brincDoc._id}`)
  console.log(`  • Govee Alex ${goveeDoc._id}`)
  console.log(`Would DELETE merged Casting Alex ${MERGED_CASTING_ALEX_ID} after refs=0`)
  console.log(`Would NOT touch Post Alex ${POST_ALEX_ID}`)

  if (!APPLY) {
    console.log('\nDry-run complete. No creditIdentity creates, portfolio patches, or deletes.')
    return
  }

  console.log('\nApplying live writes...')
  let errors = 0

  try {
    await client.createIfNotExists(brincDoc)
    console.log(`CREATE BRINC Alex (${brincDoc._id})`)
    await client.createIfNotExists(goveeDoc)
    console.log(`CREATE Govee Alex (${goveeDoc._id})`)
  } catch (error) {
    console.error('ERROR creating identities:', error)
    process.exit(1)
  }

  for (const slot of resolved) {
    try {
      const doc = bySlug.get(slot.slug)!
      const identityId = identityByLabel[slot.label]
      const nextCredits = patchSlotCredits(doc.crewCredits, slot, identityId, CANONICAL_NAME)
      await client
        .patch(slot.documentId)
        .set({crewCredits: nextCredits})
        .commit({returnDocuments: false})
      console.log(`PATCH ${slot.slug} — "${slot.name}" → ${identityId}`)
    } catch (error) {
      errors += 1
      console.error(`ERROR patching ${slot.slug}:`, error)
    }
  }

  if (errors > 0) {
    console.error(`\nApply failed with ${errors} error(s) — merged identity NOT deleted`)
    process.exit(1)
  }

  const remainingRefs = await client.fetch<number>(`count(*[references($id)])`, {
    id: MERGED_CASTING_ALEX_ID,
  })
  console.log(`\nRemaining refs on ${MERGED_CASTING_ALEX_ID}: ${remainingRefs}`)
  if (remainingRefs !== 0) {
    console.error('Expected 0 remaining refs before delete — aborting delete')
    process.exit(1)
  }

  await client.delete(MERGED_CASTING_ALEX_ID)
  console.log(`DELETE ${MERGED_CASTING_ALEX_ID}`)

  console.log('\nPost-apply verification...')
  const alexDocs = await client.fetch<Array<{_id: string; name?: string}>>(
    `*[_type == "creditIdentity" && name == $name && !(_id in path("drafts.**"))]{_id, name} | order(_id asc)`,
    {name: CANONICAL_NAME},
  )
  console.log(`Alex identities now: ${alexDocs.length}`)
  for (const doc of alexDocs) {
    const refs = await client.fetch<number>(`count(*[references($id)])`, {id: doc._id})
    console.log(`  • ${doc._id} refs=${refs}`)
  }

  const mergedGone = await client.fetch<string | null>(
    `*[_id == $id][0]._id`,
    {id: MERGED_CASTING_ALEX_ID},
  )
  if (mergedGone) {
    console.error(`Merged identity still exists: ${mergedGone}`)
    process.exit(1)
  }
  console.log(`Merged Casting Alex deleted: confirmed absent`)

  const postAfter = await client.fetch<{_id: string; name?: string} | null>(
    `*[_type == "creditIdentity" && _id == $id][0]{_id, name}`,
    {id: POST_ALEX_ID},
  )
  const postPortfolioAfter = await client.fetch<{
    crewCredits?: CrewCreditValue[]
  } | null>(
    `*[_type == "portfolioEntry" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
      crewCredits
    }`,
    {slug: 'youtube-shopping-reason-to-believe'},
  )
  let postStillOk = false
  for (const credit of postPortfolioAfter?.crewCredits ?? []) {
    if (credit.department !== 'post' || credit.roleKey !== 'motion_graphics') continue
    for (const person of credit.people ?? []) {
      if (person._key !== '00oceyquckz9') continue
      postStillOk =
        person.identity?._ref === POST_ALEX_ID && person.name?.trim() === CANONICAL_NAME
    }
  }
  if (!postAfter || postAfter.name?.trim() !== CANONICAL_NAME || !postStillOk) {
    console.error('Post Alex changed unexpectedly', {postAfter, postStillOk})
    process.exit(1)
  }
  console.log(`Post Alex unchanged: ${POST_ALEX_ID}`)

  if (alexDocs.length !== 3) {
    console.error(`Expected exactly 3 Alex identities, found ${alexDocs.length}`)
    process.exit(1)
  }
  const expectedIds = new Set([brincDoc._id, goveeDoc._id, POST_ALEX_ID])
  for (const doc of alexDocs) {
    if (!expectedIds.has(doc._id)) {
      console.error(`Unexpected Alex identity: ${doc._id}`)
      process.exit(1)
    }
  }
  for (const id of [brincDoc._id, goveeDoc._id, POST_ALEX_ID]) {
    const refs = await client.fetch<number>(`count(*[references($id)])`, {id})
    if (refs !== 1) {
      console.error(`Expected 1 ref for ${id}, found ${refs}`)
      process.exit(1)
    }
  }

  console.log('\nApply complete. 0 errors.')
  console.log(`BRINC Alex: ${brincDoc._id}`)
  console.log(`Govee Alex: ${goveeDoc._id}`)
  console.log(`Post Alex (untouched): ${POST_ALEX_ID}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
