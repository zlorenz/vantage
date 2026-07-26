/**
 * ⚠️ DO NOT RUN UNFILTERED. scripts/migration/data/credit-identity-map.json
 * holds 230 identities against 180 live — ~50 IDs exist only in the map. This
 * script merges map-then-live and resolves by normalized name, so map-only
 * hits return created: false, are never created, but refs are still written.
 * Because crewPerson.identity is weak: true the commit succeeds silently,
 * producing dangling references that render as linked in Studio. Fix before
 * any use: resolve against live identities only, or filter the map to
 * liveIdSet. A Brand-scoped run is safe (all Brand names resolve to live IDs);
 * a full-role run is not. See content-schema.md decisions appendix.
 *
 * Link filter-role crewPerson slots to creditIdentity refs.
 *
 * Prefers scripts/migration/data/credit-identity-map.json from the backfill
 * step; falls back to live creditIdentity docs by normalized name.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/link-credit-identities-on-credits.ts
 *   npx tsx scripts/migration/patch/link-credit-identities-on-credits.ts --apply
 */

import fs from 'node:fs'
import path from 'node:path'

import type {CrewCreditValue} from '../../../shared/crew-credits'
import {
  resolveIdentityLinksOnCredits,
  type CreditIdentityDoc,
} from '../../../sanity/components/crew-credits/sync-credit-identities'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')
const MAP_PATH = path.join(
  process.cwd(),
  'scripts/migration/data/credit-identity-map.json',
)

interface PortfolioDoc {
  _id: string
  title?: string
  slug?: string
  crewCredits?: CrewCreditValue[]
}

function creditsNeedLink(
  before: CrewCreditValue[] | undefined,
  after: CrewCreditValue[],
): boolean {
  const left = before ?? []
  if (left.length !== after.length) return true
  for (let i = 0; i < left.length; i++) {
    const lp = left[i]?.people ?? []
    const rp = after[i]?.people ?? []
    if (lp.length !== rp.length) return true
    for (let j = 0; j < lp.length; j++) {
      if ((lp[j]?.identity?._ref ?? '') !== (rp[j]?.identity?._ref ?? '')) {
        return true
      }
    }
  }
  return false
}

async function main() {
  const client = getWriteClient()

  let mappedIdentities: CreditIdentityDoc[] = []
  if (fs.existsSync(MAP_PATH)) {
    const raw = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8')) as {
      identities?: Array<{_id: string; name: string; url?: string}>
    }
    mappedIdentities = (raw.identities ?? []).map((row) => ({
      _id: row._id,
      name: row.name,
      ...(row.url ? {url: row.url} : {}),
    }))
    console.log(`Loaded ${mappedIdentities.length} identities from map file`)
  }

  const [liveIdentities, docs] = await Promise.all([
    client.fetch<CreditIdentityDoc[]>(
      `*[_type == "creditIdentity"]{ _id, name, url }`,
    ),
    client.fetch<PortfolioDoc[]>(
      `*[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
        _id,
        title,
        "slug": slug.current,
        crewCredits
      }`,
    ),
  ])

  // Prefer live docs; map fills gaps for dry-run before create.
  const byId = new Map<string, CreditIdentityDoc>()
  for (const doc of [...mappedIdentities, ...(liveIdentities ?? [])]) {
    byId.set(doc._id, doc)
  }
  const existing = [...byId.values()]

  let wouldPatch = 0
  let wouldCreate = 0
  let skipped = 0
  let linkedSlots = 0

  for (const doc of docs ?? []) {
    const resolved = resolveIdentityLinksOnCredits(doc.crewCredits, existing)
    wouldCreate += resolved.createIdentities.length

    // Newly planned creates become matchable later in this run.
    for (const created of resolved.createIdentities) {
      existing.push({_id: created._id, name: created.name, url: created.url})
    }

    if (!creditsNeedLink(doc.crewCredits, resolved.nextCredits)) {
      skipped += 1
      continue
    }

    wouldPatch += 1
    linkedSlots += resolved.links.filter((link) => link.created || true).length
    const label = doc.slug || doc.title || doc._id
    console.log(
      `${APPLY ? 'PATCH' : 'WOULD PATCH'} ${label} — create=${resolved.createIdentities.length} links=${resolved.links.length}`,
    )

    if (APPLY) {
      for (const identity of resolved.createIdentities) {
        await client.createIfNotExists(identity)
      }
      await client
        .patch(doc._id)
        .set({crewCredits: resolved.nextCredits})
        .commit({returnDocuments: false})
    }
  }

  console.log(
    `${APPLY ? 'Done' : 'Dry-run'}: patch=${wouldPatch}, skip=${skipped}, wouldCreateIdentities=${wouldCreate}, linkedSlots≈${linkedSlots}`,
  )
  if (!APPLY) {
    console.log('Re-run with --apply to write identity refs onto crewCredits.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
