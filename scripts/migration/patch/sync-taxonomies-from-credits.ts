/**
 * Sync portfolioEntry.clients / crewMembers from structured crewCredits.
 *
 * Brand → client refs
 * Director / DOP / Art Director → crewMember refs
 *
 * Runs outside Studio so it does not race the document listen channel.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/sync-taxonomies-from-credits.ts
 *   npx tsx scripts/migration/patch/sync-taxonomies-from-credits.ts --apply
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local for --apply.
 */

import type {CrewCreditValue} from '../../../shared/crew-credits'
import {
  planTaxonomySyncFromCredits,
  resolveTaxonomyPatch,
  type ExistingClientDoc,
  type ExistingCrewMemberDoc,
} from '../../../sanity/components/crew-credits/sync-taxonomies-from-credits'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

interface PortfolioDoc {
  _id: string
  title?: string
  slug?: string
  crewCredits?: CrewCreditValue[]
  clients?: {_ref?: string}[]
  crewMembers?: {_ref?: string}[]
}

function refsEqual(
  current: {_ref?: string}[] | undefined,
  next: {_ref: string}[],
): boolean {
  const a = (current ?? []).map((r) => r._ref).filter(Boolean).sort()
  const b = next.map((r) => r._ref).sort()
  return a.length === b.length && a.every((id, i) => id === b[i])
}

async function main() {
  const client = getWriteClient()

  const [existingClients, existingCrew, docs] = await Promise.all([
    client.fetch<ExistingClientDoc[]>(
      `*[_type == "client"]{ _id, name, "slug": slug.current }`,
    ),
    client.fetch<ExistingCrewMemberDoc[]>(
      `*[_type == "crewMember"]{ _id, name, "slug": slug.current, role }`,
    ),
    client.fetch<PortfolioDoc[]>(
      `*[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
        _id,
        title,
        "slug": slug.current,
        crewCredits,
        clients[]{_ref},
        crewMembers[]{_ref}
      }`,
    ),
  ])

  const clients = existingClients ?? []
  const crew = existingCrew ?? []

  let wouldPatch = 0
  let wouldCreateClients = 0
  let wouldCreateCrew = 0
  let skipped = 0

  const createClientIds = new Set<string>()
  const createCrewIds = new Set<string>()

  for (const doc of docs ?? []) {
    const plan = planTaxonomySyncFromCredits(doc.crewCredits)
    const resolved = resolveTaxonomyPatch(plan, clients, crew)

    for (const c of resolved.createClients) createClientIds.add(c._id)
    for (const c of resolved.createCrewMembers) createCrewIds.add(c._id)

    const alreadySynced =
      refsEqual(doc.clients, resolved.clients) &&
      refsEqual(doc.crewMembers, resolved.crewMembers)

    if (alreadySynced) {
      skipped += 1
      continue
    }

    wouldPatch += 1
    const label = doc.slug || doc.title || doc._id
    console.log(
      `${APPLY ? 'PATCH' : 'WOULD PATCH'} ${label} — clients=${resolved.clients.length} crew=${resolved.crewMembers.length}`,
    )

    if (APPLY) {
      for (const c of resolved.createClients) {
        await client.createIfNotExists(c)
      }
      for (const c of resolved.createCrewMembers) {
        await client.createIfNotExists(c)
      }
      // Newly created docs become matchable for later entries in this run.
      for (const c of resolved.createClients) {
        clients.push({_id: c._id, name: c.name, slug: c.slug.current})
      }
      for (const c of resolved.createCrewMembers) {
        crew.push({
          _id: c._id,
          name: c.name,
          slug: c.slug.current,
          role: c.role,
        })
      }

      await client
        .patch(doc._id)
        .set({
          clients: resolved.clients,
          crewMembers: resolved.crewMembers,
        })
        .commit({returnDocuments: false})
    }
  }

  wouldCreateClients = createClientIds.size
  wouldCreateCrew = createCrewIds.size

  console.log('')
  console.log(
    APPLY ? 'Applied taxonomy sync from crewCredits.' : 'Dry-run only (pass --apply to write).',
  )
  console.log(`Entries scanned: ${(docs ?? []).length}`)
  console.log(`Already in sync: ${skipped}`)
  console.log(`${APPLY ? 'Patched' : 'Would patch'}: ${wouldPatch}`)
  console.log(
    `${APPLY ? 'Created' : 'Would create'} clients: ${wouldCreateClients}, crewMembers: ${wouldCreateCrew}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
