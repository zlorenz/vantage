/**
 * Resolve the 21 Post review-queue slots after cross-department-exact apply.
 *
 * - 14 slots: link to existing identities (Husain Amer, Alexis Odiowei, Lynn Nguyen, Tự Nguyễn)
 * - 7 slots: create 2 new Post-only identities (Alex, Hằng Nguyễn)
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/resolve-post-review-slots.ts
 *   npx tsx scripts/migration/patch/resolve-post-review-slots.ts --apply
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
const DEPARTMENT = 'post' as const

/** Flagged cross-department candidates — must NOT receive these refs. */
const FORBIDDEN_IDENTITY_IDS = new Set([
  'ci_f401ceff0f834606818caf', // Alex (Casting)
  'ci_06d5840b669849448703e9', // Hằng Nguyễn (Art)
])

const EXISTING_IDENTITY = {
  husain_amer: 'ci_95ddcf5d0180455f99e1b6',
  alexis_odiowei: 'ci_68a56c6e3339460aa1524e',
  lynn_nguyen: 'ci_3298dcfec9d7417dae1f79',
  tu_nguyen: 'ci_763e94504dbb42f88dbea0',
} as const

type LinkTarget = {
  slug: string
  roleKey: string
  personKey: string
  identityKey: keyof typeof EXISTING_IDENTITY
}

type CreateTarget = {
  slug: string
  roleKey: string
  personKey: string
  identityNameKey: 'alex' | 'hang_nguyen'
}

/** personKeys re-confirmed via GROQ before patching (Sep 2026). */
const LINK_TARGETS: LinkTarget[] = [
  {slug: 'hasselblad-x1d', roleKey: 'editor', personKey: 'ud2k2kmlmci', identityKey: 'husain_amer'},
  {
    slug: 'dji-osmo-mobile-campaign',
    roleKey: 'colorist',
    personKey: 'hqy68n9gow8',
    identityKey: 'alexis_odiowei',
  },
  {
    slug: 'zhiyun-weebill-3s-crane-3s',
    roleKey: 'colorist',
    personKey: 'kmdzfpvk7e',
    identityKey: 'alexis_odiowei',
  },
  {
    slug: 'realme-15-series-5g-live-real-in-every-shot',
    roleKey: 'motion_graphics',
    personKey: 'k36303wwspp',
    identityKey: 'lynn_nguyen',
  },
  {
    slug: 'realme-c85-your-ultimate-outdoor-sidekick',
    roleKey: 'motion_graphics',
    personKey: '70cptt6nvgd',
    identityKey: 'lynn_nguyen',
  },
  {
    slug: 'bitget-getagent-ft-julian-alvarez',
    roleKey: 'motion_graphics',
    personKey: 'b5fadr5c4ac',
    identityKey: 'lynn_nguyen',
  },
  {
    slug: 'mammotion-yuka-mini-2',
    roleKey: 'motion_graphics',
    personKey: 'kys164vccvh',
    identityKey: 'lynn_nguyen',
  },
  {
    slug: 'mammotion-luba-3-awd',
    roleKey: 'motion_graphics',
    personKey: 'rnu33p0j8mg',
    identityKey: 'lynn_nguyen',
  },
  {
    slug: 'govee-outdoor-lights-unstoppable-fun',
    roleKey: 'motion_graphics',
    personKey: 'ww5g8y62zt',
    identityKey: 'lynn_nguyen',
  },
  {
    slug: 'bambu-lab-h2d-your-personal-manufacturing-hub',
    roleKey: 'post_supervisor',
    personKey: 'mv23z4vds6',
    identityKey: 'tu_nguyen',
  },
  {
    slug: 'bitget-getagent-ft-julian-alvarez',
    roleKey: 'motion_graphics',
    personKey: 'xop2iw9rfn',
    identityKey: 'tu_nguyen',
  },
  {
    slug: 'mammotion-yuka-mini-2',
    roleKey: 'motion_graphics',
    personKey: '4a2fpzcv1s',
    identityKey: 'tu_nguyen',
  },
  {
    slug: 'mammotion-luba-3-awd',
    roleKey: 'motion_graphics',
    personKey: 'pzr0cqo2f47',
    identityKey: 'tu_nguyen',
  },
  {
    slug: 'realme-15-pro-5g',
    roleKey: 'post_supervisor',
    personKey: '2lsx3e596h9',
    identityKey: 'tu_nguyen',
  },
]

const CREATE_TARGETS: CreateTarget[] = [
  {
    slug: 'youtube-shopping-reason-to-believe',
    roleKey: 'motion_graphics',
    personKey: '00oceyquckz9',
    identityNameKey: 'alex',
  },
  {
    slug: 'roborock-s7-maxv-ultra-everything-made-easy',
    roleKey: 'post_supervisor',
    personKey: '4msbgg2bhce',
    identityNameKey: 'hang_nguyen',
  },
  {
    slug: 'mammotion-luba-automated-robot-lawn-mower',
    roleKey: 'vfx',
    personKey: '2l2ssfbtdhq',
    identityNameKey: 'hang_nguyen',
  },
  {
    slug: 'insta360-link-the-ai-powered-4k-webcam',
    roleKey: 'vfx',
    personKey: '6p10owtq61c',
    identityNameKey: 'hang_nguyen',
  },
  {slug: 'comfort-disco', roleKey: 'vfx', personKey: 'jjrulqetod', identityNameKey: 'hang_nguyen'},
  {
    slug: 'realme-15-series-5g-live-real-in-every-shot',
    roleKey: 'post_supervisor',
    personKey: 'tr8wjnsk2w',
    identityNameKey: 'hang_nguyen',
  },
  {
    slug: 'govee-for-every-mood-of-home',
    roleKey: 'post_supervisor',
    personKey: 'm5enzgykii',
    identityNameKey: 'hang_nguyen',
  },
]

const EXPECTED_LINK_COUNT = 14
const EXPECTED_CREATE_SLOT_COUNT = 7
const EXPECTED_NEW_IDENTITY_COUNT = 2
const EXPECTED_TOTAL_SLOTS = 21

type PortfolioDoc = {
  _id: string
  slug?: string
  crewCredits?: CrewCreditValue[]
}

type ResolvedLinkSlot = LinkTarget & {
  documentId: string
  name: string
  identityId: string
  hadIdentity: boolean
}

type ResolvedCreateSlot = CreateTarget & {
  documentId: string
  name: string
  hadIdentity: boolean
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

async function fetchCanonicalNames(client: ReturnType<typeof getWriteClient>) {
  const ids = Object.values(EXISTING_IDENTITY)
  const rows = await client.fetch<Array<{_id: string; name?: string}>>(
    `*[_type == "creditIdentity" && _id in $ids]{_id, name}`,
    {ids},
  )
  const byId = new Map((rows ?? []).map((row) => [row._id, row.name?.trim() ?? '']))
  const names: Record<keyof typeof EXISTING_IDENTITY, string> = {
    husain_amer: byId.get(EXISTING_IDENTITY.husain_amer) ?? '',
    alexis_odiowei: byId.get(EXISTING_IDENTITY.alexis_odiowei) ?? '',
    lynn_nguyen: byId.get(EXISTING_IDENTITY.lynn_nguyen) ?? '',
    tu_nguyen: byId.get(EXISTING_IDENTITY.tu_nguyen) ?? '',
  }
  for (const [key, name] of Object.entries(names)) {
    if (!name) {
      throw new Error(`Missing canonical name for existing identity: ${key}`)
    }
  }
  return names
}

async function main() {
  const client = getWriteClient()
  console.log(`Mode: ${APPLY ? 'APPLY (live writes)' : 'DRY RUN ONLY'}`)

  const canonicalNames = await fetchCanonicalNames(client)
  console.log('Existing identity canonical names:')
  for (const [key, id] of Object.entries(EXISTING_IDENTITY)) {
    console.log(`  • ${key}: "${canonicalNames[key as keyof typeof EXISTING_IDENTITY]}" (${id})`)
  }
  console.log('')

  const allSlugs = [
    ...new Set([...LINK_TARGETS.map((s) => s.slug), ...CREATE_TARGETS.map((s) => s.slug)]),
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
  for (const target of LINK_TARGETS) {
    const doc = bySlug.get(target.slug)
    if (!doc) {
      console.error(`Missing portfolio for slug: ${target.slug}`)
      process.exit(1)
    }
    const person = findPostPerson(doc, target.roleKey, target.personKey)
    if (!person) {
      console.error(
        `Link slot not found: ${target.slug} post/${target.roleKey} personKey=${target.personKey}`,
      )
      process.exit(1)
    }
    if (person.hadIdentity) {
      console.error(
        `Link slot already has identity: ${target.slug} → ${person.existingIdentityId}`,
      )
      process.exit(1)
    }
    const identityId = EXISTING_IDENTITY[target.identityKey]
    if (FORBIDDEN_IDENTITY_IDS.has(identityId)) {
      console.error(`Forbidden identity for link slot: ${target.slug} → ${identityId}`)
      process.exit(1)
    }
    resolvedLinks.push({
      ...target,
      documentId: doc._id,
      name: person.name,
      identityId,
      hadIdentity: person.hadIdentity,
    })
  }

  const resolvedCreates: ResolvedCreateSlot[] = []
  for (const target of CREATE_TARGETS) {
    const doc = bySlug.get(target.slug)
    if (!doc) {
      console.error(`Missing portfolio for slug: ${target.slug}`)
      process.exit(1)
    }
    const person = findPostPerson(doc, target.roleKey, target.personKey)
    if (!person) {
      console.error(
        `Create slot not found: ${target.slug} post/${target.roleKey} personKey=${target.personKey}`,
      )
      process.exit(1)
    }
    if (person.hadIdentity) {
      console.error(
        `Create slot already has identity: ${target.slug} → ${person.existingIdentityId}`,
      )
      process.exit(1)
    }
    resolvedCreates.push({
      ...target,
      documentId: doc._id,
      name: person.name,
      hadIdentity: person.hadIdentity,
    })
  }

  const alexSlots = resolvedCreates.filter((s) => s.identityNameKey === 'alex')
  const hangSlots = resolvedCreates.filter((s) => s.identityNameKey === 'hang_nguyen')

  if (alexSlots.length !== 1 || hangSlots.length !== 6) {
    console.error(`Expected 1 Alex + 6 Hằng Nguyễn create slots, got ${alexSlots.length} + ${hangSlots.length}`)
    process.exit(1)
  }

  const alexName = alexSlots[0]!.name
  const hangName = hangSlots[0]!.name
  if (!hangSlots.every((s) => s.name === hangName)) {
    console.error('Hằng Nguyễn slot spellings differ — aborting')
    process.exit(1)
  }

  const alexDoc = newCreditIdentityDoc(alexName)
  const hangDoc = newCreditIdentityDoc(hangName)
  const newIdentities = [alexDoc, hangDoc]

  const identityIdByKey: Record<CreateTarget['identityNameKey'], string> = {
    alex: alexDoc._id,
    hang_nguyen: hangDoc._id,
  }

  console.log(`Found ${resolvedLinks.length} link slot(s) + ${resolvedCreates.length} create slot(s):`)
  for (const slot of resolvedLinks) {
    const canonical = canonicalNames[slot.identityKey]
    console.log(
      `  • [link] "${slot.name}" [post/${slot.roleKey}] on ${slot.slug} ` +
        `personKey=${slot.personKey} → ${slot.identityId} name→"${canonical}"`,
    )
  }
  for (const slot of resolvedCreates) {
    const identityId = identityIdByKey[slot.identityNameKey]
    console.log(
      `  • [create] "${slot.name}" [post/${slot.roleKey}] on ${slot.slug} ` +
        `personKey=${slot.personKey} → NEW ${identityId}`,
    )
  }

  if (
    resolvedLinks.length !== EXPECTED_LINK_COUNT ||
    resolvedCreates.length !== EXPECTED_CREATE_SLOT_COUNT ||
    resolvedLinks.length + resolvedCreates.length !== EXPECTED_TOTAL_SLOTS
  ) {
    console.error(
      `Expected ${EXPECTED_TOTAL_SLOTS} slots (${EXPECTED_LINK_COUNT} link + ${EXPECTED_CREATE_SLOT_COUNT} create)`,
    )
    process.exit(1)
  }

  if (newIdentities.length !== EXPECTED_NEW_IDENTITY_COUNT) {
    console.error(`Expected ${EXPECTED_NEW_IDENTITY_COUNT} new identities`)
    process.exit(1)
  }

  for (const doc of newIdentities) {
    if (FORBIDDEN_IDENTITY_IDS.has(doc._id)) {
      console.error(`New identity id collides with forbidden id: ${doc._id}`)
      process.exit(1)
    }
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
    const identityId = identityIdByKey[slot.identityNameKey]
    patchedDocs.set(
      slot.documentId,
      patchSlotWithIdentity(base, slot.roleKey, slot.personKey, identityId),
    )
  }

  for (const slot of resolvedLinks) {
    const doc = bySlug.get(slot.slug)!
    const base = patchedDocs.get(slot.documentId) ?? doc.crewCredits
    const canonical = canonicalNames[slot.identityKey]
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
