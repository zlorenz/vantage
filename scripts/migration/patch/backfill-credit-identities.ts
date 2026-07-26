/**
 * Backfill creditIdentity docs from legacy client / crewMember taxonomies
 * and Editor credit names. Merges by normalized name across roles/types.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/backfill-credit-identities.ts
 *   npx tsx scripts/migration/patch/backfill-credit-identities.ts --apply
 *
 * Writes scripts/migration/data/credit-identity-map.json for the link step.
 */

import fs from 'node:fs'
import path from 'node:path'

import {
  creditIdentityId,
  FILTER_CREDIT_ROLE_KEYS,
  normalizeCreditToken,
  type CrewCreditValue,
} from '../../../shared/crew-credits'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')
const OUT_PATH = path.join(
  process.cwd(),
  'scripts/migration/data/credit-identity-map.json',
)

interface SourceRow {
  source: 'client' | 'crewMember' | 'credit-name'
  oldId?: string
  name: string
  url?: string
}

interface IdentityMapFile {
  generatedAt: string
  identities: Array<{
    _id: string
    name: string
    url?: string
    sources: SourceRow[]
  }>
  byOldId: Record<string, string>
  byNameKey: Record<string, string>
}

function namesFromCredits(
  credits: CrewCreditValue[] | undefined,
  roleKey: string,
): string[] {
  if (!credits?.length) return []
  const names: string[] = []
  for (const credit of credits) {
    if (credit.roleKey !== roleKey) continue
    for (const person of credit.people ?? []) {
      const name = person.name?.trim()
      if (name) names.push(name)
    }
  }
  return names
}

async function main() {
  const client = getWriteClient()

  const [clients, crewMembers, portfolios, existingIdentities] = await Promise.all([
    client.fetch<Array<{_id: string; name?: string; url?: string}>>(
      `*[_type == "client"]{ _id, name }`,
    ),
    client.fetch<Array<{_id: string; name?: string; role?: string}>>(
      `*[_type == "crewMember"]{ _id, name, role }`,
    ),
    client.fetch<Array<{crewCredits?: CrewCreditValue[]}>>(
      `*[_type == "portfolioEntry" && defined(crewCredits)]{ crewCredits }`,
    ),
    client.fetch<Array<{_id: string; name?: string; url?: string}>>(
      `*[_type == "creditIdentity"]{ _id, name, url }`,
    ),
  ])

  const sources: SourceRow[] = []

  for (const doc of clients ?? []) {
    const name = doc.name?.trim()
    if (!name) continue
    sources.push({source: 'client', oldId: doc._id, name})
  }

  for (const doc of crewMembers ?? []) {
    const name = doc.name?.trim()
    if (!name) continue
    sources.push({source: 'crewMember', oldId: doc._id, name})
  }

  for (const entry of portfolios ?? []) {
    for (const roleKey of FILTER_CREDIT_ROLE_KEYS) {
      for (const name of namesFromCredits(entry.crewCredits, roleKey)) {
        sources.push({source: 'credit-name', name})
      }
    }
  }

  // Pool existing identities first so we reuse them.
  const byNameKey = new Map<string, {_id: string; name: string; url?: string; sources: SourceRow[]}>()

  for (const doc of existingIdentities ?? []) {
    const name = doc.name?.trim()
    if (!name) continue
    const key = normalizeCreditToken(name)
    if (!key || byNameKey.has(key)) continue
    byNameKey.set(key, {
      _id: doc._id,
      name,
      ...(doc.url ? {url: doc.url} : {}),
      sources: [],
    })
  }

  let wouldCreate = 0
  for (const row of sources) {
    const key = normalizeCreditToken(row.name)
    if (!key) continue
    const existing = byNameKey.get(key)
    if (existing) {
      existing.sources.push(row)
      continue
    }
    const id = creditIdentityId()
    byNameKey.set(key, {
      _id: id,
      name: row.name.trim(),
      sources: [row],
    })
    wouldCreate += 1
  }

  const identities = [...byNameKey.values()]
  const byOldId: Record<string, string> = {}
  const byNameKeyOut: Record<string, string> = {}

  for (const identity of identities) {
    const key = normalizeCreditToken(identity.name)
    if (key) byNameKeyOut[key] = identity._id
    for (const source of identity.sources) {
      if (source.oldId) byOldId[source.oldId] = identity._id
    }
  }

  const mapFile: IdentityMapFile = {
    generatedAt: new Date().toISOString(),
    identities: identities.map((identity) => ({
      _id: identity._id,
      name: identity.name,
      ...(identity.url ? {url: identity.url} : {}),
      sources: identity.sources,
    })),
    byOldId,
    byNameKey: byNameKeyOut,
  }

  fs.mkdirSync(path.dirname(OUT_PATH), {recursive: true})
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(mapFile, null, 2)}\n`)

  console.log(
    `${APPLY ? 'APPLY' : 'DRY-RUN'}: ${identities.length} identities (${wouldCreate} new), map → ${OUT_PATH}`,
  )

  if (!APPLY) {
    console.log('Re-run with --apply to create missing creditIdentity documents.')
    return
  }

  let created = 0
  for (const identity of identities) {
    const result = await client.createIfNotExists({
      _id: identity._id,
      _type: 'creditIdentity',
      name: identity.name,
      ...(identity.url ? {url: identity.url} : {}),
    })
    // createIfNotExists returns the doc; count only when we intended a new id
    // that was not already in Sanity before this run.
    if (
      !(existingIdentities ?? []).some((doc) => doc._id === identity._id) &&
      identity.sources.length
    ) {
      created += 1
    }
    void result
  }

  console.log(`Created/ensured identities. New in this run (approx): ${created}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
