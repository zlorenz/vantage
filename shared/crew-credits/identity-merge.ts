/**
 * creditIdentity merge — scan, plan, and execute repoint + delete.
 *
 * Dry-run by default: `executeMerge` performs zero writes unless `{apply: true}`.
 * Never delete the duplicate until a post-repoint scan finds zero non-trashed refs.
 */

import {PROPAGATION_CHUNK_SIZE} from '../phrase-book/propagate'
import {applyPersonRenameToCredits} from './rename-credits'
import type {CrewCreditValue} from './types'

export type PortfolioVariant = 'published' | 'draft' | 'scheduled'

export type MergePersonMatch = {
  creditKey?: string
  roleKey?: string
  role: string
  department?: string
  personKey?: string
  personName: string
}

export type MergeReferenceHit = {
  documentId: string
  variant: PortfolioVariant
  publishedId: string
  title: string
  isHidden: boolean
  isTrashed: boolean
  matches: MergePersonMatch[]
}

export type MergeIdentitySnapshot = {
  _id: string
  name: string
  nameZh?: string
  url?: string
}

export type MergeFieldDiff = {
  nameZh?: string
  url?: string
}

export type MergeRepointAction = {
  documentId: string
  variant: PortfolioVariant
  title: string
  crewCredits: CrewCreditValue[]
  matchCount: number
}

export type MergePlan = {
  duplicateId: string
  canonicalId: string
  duplicate: MergeIdentitySnapshot
  canonical: MergeIdentitySnapshot
  fieldDiff: MergeFieldDiff
  references: MergeReferenceHit[]
  repointActions: MergeRepointAction[]
  trashedReferences: MergeReferenceHit[]
}

export type ExecuteMergeOptions = {
  /** When false (default), log the planned writes and perform zero mutations. */
  apply?: boolean
}

export type ExecuteMergeResult = {
  dryRun: boolean
  repointedDocuments: number
  repointedPeople: number
  canonicalFieldsPatched: boolean
  verifiedClean: boolean
  duplicateDeleted: boolean
  trashedSkipped: number
  stillReferencing?: MergeReferenceHit[]
  error?: string
}

export type MergeScanPortfolio = {
  _id: string
  title?: string
  isHidden?: boolean
  trash?: {trashedAt?: string}
  crewCredits?: CrewCreditValue[]
}

export const MERGE_REFERENCE_SCAN_QUERY = `
  *[_type == "portfolioEntry" && references($duplicateId)]{
    _id,
    title,
    isHidden,
    trash,
    crewCredits[]{
      _key,
      roleKey,
      role,
      department,
      isCustomRole,
      people[]{
        _key,
        name,
        identity
      }
    }
  }
`

const CREDIT_IDENTITY_FETCH_QUERY = `
  *[_type == "creditIdentity" && _id in $ids]{
    _id,
    name,
    nameZh,
    url
  }
`

export type IdentityMergeClient = {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>
  patch: (id: string) => {
    set: (fields: Record<string, unknown>) => {commit: () => Promise<unknown>}
  }
  delete: (id: string) => Promise<unknown>
}

export function classifyPortfolioVariantId(id: string): PortfolioVariant {
  if (id.startsWith('drafts.')) return 'draft'
  if (id.startsWith('versions.')) return 'scheduled'
  return 'published'
}

export function publishedPortfolioIdFromVariant(id: string): string {
  if (id.startsWith('drafts.')) return id.slice('drafts.'.length)
  if (id.startsWith('versions.')) {
    const parts = id.split('.')
    return parts.slice(2).join('.')
  }
  return id
}

function portfolioTitle(doc: MergeScanPortfolio): string {
  const title = doc.title?.trim()
  return title || 'Untitled'
}

function identityRefMatches(
  ref: string | undefined,
  duplicateId: string,
): boolean {
  if (!ref) return false
  return ref === duplicateId
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

/**
 * Scan in-memory portfolio docs for crewCredits identity refs to duplicateId.
 * Includes all roleKeys, hidden portfolios, and trashed variants.
 */
export function scanMergeReferencesFromPortfolios(
  portfolios: MergeScanPortfolio[],
  duplicateId: string,
): MergeReferenceHit[] {
  const hits: MergeReferenceHit[] = []

  for (const doc of portfolios) {
    const matches: MergePersonMatch[] = []
    for (const credit of doc.crewCredits ?? []) {
      for (const person of credit.people ?? []) {
        if (!identityRefMatches(person.identity?._ref, duplicateId)) continue
        matches.push({
          creditKey: credit._key,
          roleKey: credit.roleKey,
          role: credit.role,
          department: credit.department,
          personKey: person._key,
          personName: person.name ?? '',
        })
      }
    }
    if (!matches.length) continue

    hits.push({
      documentId: doc._id,
      variant: classifyPortfolioVariantId(doc._id),
      publishedId: publishedPortfolioIdFromVariant(doc._id),
      title: portfolioTitle(doc),
      isHidden: Boolean(doc.isHidden),
      isTrashed: Boolean(doc.trash?.trashedAt),
      matches,
    })
  }

  return hits.sort((a, b) => {
    const titleCmp = a.title.localeCompare(b.title, undefined, {sensitivity: 'base'})
    if (titleCmp !== 0) return titleCmp
    return a.documentId.localeCompare(b.documentId)
  })
}

export async function scanMergeReferences(
  client: IdentityMergeClient,
  duplicateId: string,
): Promise<MergeReferenceHit[]> {
  const portfolios = await client.fetch<MergeScanPortfolio[]>(
    MERGE_REFERENCE_SCAN_QUERY,
    {duplicateId},
  )
  return scanMergeReferencesFromPortfolios(portfolios ?? [], duplicateId)
}

/** Fill blank canonical fields from duplicate; canonical values always win. */
export function computeIdentityFieldDiff(
  duplicate: MergeIdentitySnapshot,
  canonical: MergeIdentitySnapshot,
): MergeFieldDiff {
  const diff: MergeFieldDiff = {}
  const canonicalNameZh = canonical.nameZh?.trim()
  const duplicateNameZh = duplicate.nameZh?.trim()
  if (!canonicalNameZh && duplicateNameZh) {
    diff.nameZh = duplicateNameZh
  }
  const canonicalUrl = canonical.url?.trim()
  const duplicateUrl = duplicate.url?.trim()
  if (!canonicalUrl && duplicateUrl) {
    diff.url = duplicateUrl
  }
  return diff
}

/** Repoint every crewPerson.identity._ref from duplicateId → canonicalId and sync person.name. */
export function repointIdentityInCredits(
  credits: CrewCreditValue[] | undefined,
  duplicateId: string,
  canonicalId: string,
  canonicalName: string,
): {credits: CrewCreditValue[]; repointedPeople: number} {
  if (!credits?.length) {
    return {credits: credits ?? [], repointedPeople: 0}
  }

  let repointedPeople = 0
  const repointed = credits.map((credit) => {
    const people = (credit.people ?? []).map((person) => {
      if (!identityRefMatches(person.identity?._ref, duplicateId)) return person
      repointedPeople += 1
      return {
        ...person,
        identity: {
          _type: 'reference' as const,
          _ref: canonicalId,
          _weak: true as const,
        },
      }
    })
    return {...credit, people}
  })

  if (!repointedPeople) {
    return {credits: repointed, repointedPeople: 0}
  }

  const {credits: synced} = applyPersonRenameToCredits(repointed, {
    fromName: '',
    toName: canonicalName.trim(),
    identityId: canonicalId,
  })

  return {credits: synced, repointedPeople}
}

function buildRepointActions(
  references: MergeReferenceHit[],
  portfoliosById: Map<string, MergeScanPortfolio>,
  duplicateId: string,
  canonicalId: string,
  canonicalName: string,
): {repointActions: MergeRepointAction[]; trashedReferences: MergeReferenceHit[]} {
  const repointActions: MergeRepointAction[] = []
  const trashedReferences: MergeReferenceHit[] = []

  for (const hit of references) {
    if (hit.isTrashed) {
      trashedReferences.push(hit)
      continue
    }
    const doc = portfoliosById.get(hit.documentId)
    if (!doc?.crewCredits) continue
    const {credits, repointedPeople} = repointIdentityInCredits(
      doc.crewCredits,
      duplicateId,
      canonicalId,
      canonicalName,
    )
    if (!repointedPeople) continue
    repointActions.push({
      documentId: hit.documentId,
      variant: hit.variant,
      title: hit.title,
      crewCredits: credits,
      matchCount: repointedPeople,
    })
  }

  return {repointActions, trashedReferences}
}

async function fetchIdentitySnapshots(
  client: IdentityMergeClient,
  duplicateId: string,
  canonicalId: string,
): Promise<{duplicate: MergeIdentitySnapshot; canonical: MergeIdentitySnapshot}> {
  const rows = await client.fetch<MergeIdentitySnapshot[]>(CREDIT_IDENTITY_FETCH_QUERY, {
    ids: [duplicateId, canonicalId],
  })
  const byId = new Map((rows ?? []).map((row) => [row._id, row]))
  const duplicate = byId.get(duplicateId)
  const canonical = byId.get(canonicalId)
  if (!duplicate) {
    throw new Error(`Duplicate creditIdentity not found: ${duplicateId}`)
  }
  if (!canonical) {
    throw new Error(`Canonical creditIdentity not found: ${canonicalId}`)
  }
  if (duplicateId === canonicalId) {
    throw new Error('Duplicate and canonical identities must be different documents')
  }
  return {duplicate, canonical}
}

/** Read-only merge planner: scan + identity field diff + repoint payloads. */
export async function planMerge(
  client: IdentityMergeClient,
  duplicateId: string,
  canonicalId: string,
): Promise<MergePlan> {
  const [{duplicate, canonical}, portfolios] = await Promise.all([
    fetchIdentitySnapshots(client, duplicateId, canonicalId),
    client.fetch<MergeScanPortfolio[]>(MERGE_REFERENCE_SCAN_QUERY, {duplicateId}),
  ])

  const references = scanMergeReferencesFromPortfolios(portfolios ?? [], duplicateId)
  const portfoliosById = new Map((portfolios ?? []).map((doc) => [doc._id, doc]))
  const {repointActions, trashedReferences} = buildRepointActions(
    references,
    portfoliosById,
    duplicateId,
    canonicalId,
    canonical.name,
  )

  return {
    duplicateId,
    canonicalId,
    duplicate,
    canonical,
    fieldDiff: computeIdentityFieldDiff(duplicate, canonical),
    references,
    repointActions,
    trashedReferences,
  }
}

function logDryRun(plan: MergePlan): void {
  console.log(
    `[identity-merge] DRY RUN — would repoint ${plan.repointActions.length} document variant(s), ` +
      `skip ${plan.trashedReferences.length} trashed variant(s), ` +
      `patch canonical ${plan.canonicalId}` +
      (Object.keys(plan.fieldDiff).length
        ? ` with ${JSON.stringify(plan.fieldDiff)}`
        : ''),
  )
  for (const action of plan.repointActions) {
    console.log(
      `[identity-merge]   repoint ${action.documentId} (${action.variant}) — ${action.matchCount} slot(s)`,
    )
  }
  if (plan.trashedReferences.length) {
    for (const hit of plan.trashedReferences) {
      console.log(
        `[identity-merge]   skip trashed ${hit.documentId} — ${hit.matches.length} slot(s)`,
      )
    }
  }
  console.log(`[identity-merge]   then verify zero refs and delete ${plan.duplicateId}`)
}

/**
 * Apply a previously-generated plan. Re-scans only for post-repoint verification,
 * not to rebuild the plan. Dry-run unless `{apply: true}`.
 */
export async function executeMerge(
  client: IdentityMergeClient,
  duplicateId: string,
  canonicalId: string,
  plan: MergePlan,
  options: ExecuteMergeOptions = {},
): Promise<ExecuteMergeResult> {
  const apply = options.apply === true

  if (
    plan.duplicateId !== duplicateId ||
    plan.canonicalId !== canonicalId
  ) {
    throw new Error('Plan identity IDs do not match executeMerge arguments')
  }

  if (!apply) {
    logDryRun(plan)
    const repointedPeople = plan.repointActions.reduce(
      (sum, action) => sum + action.matchCount,
      0,
    )
    return {
      dryRun: true,
      repointedDocuments: plan.repointActions.length,
      repointedPeople,
      canonicalFieldsPatched: Object.keys(plan.fieldDiff).length > 0,
      verifiedClean: false,
      duplicateDeleted: false,
      trashedSkipped: plan.trashedReferences.length,
    }
  }

  let repointedDocuments = 0
  let repointedPeople = 0

  for (const actionChunk of chunk(plan.repointActions, PROPAGATION_CHUNK_SIZE)) {
    for (const action of actionChunk) {
      await client.patch(action.documentId).set({crewCredits: action.crewCredits}).commit()
      repointedDocuments += 1
      repointedPeople += action.matchCount
    }
  }

  let canonicalFieldsPatched = false
  if (Object.keys(plan.fieldDiff).length > 0) {
    await client.patch(plan.canonicalId).set(plan.fieldDiff).commit()
    canonicalFieldsPatched = true
  }

  const remaining = (await scanMergeReferences(client, duplicateId)).filter(
    (hit) => !hit.isTrashed,
  )

  if (remaining.length > 0) {
    return {
      dryRun: false,
      repointedDocuments,
      repointedPeople,
      canonicalFieldsPatched,
      verifiedClean: false,
      duplicateDeleted: false,
      trashedSkipped: plan.trashedReferences.length,
      stillReferencing: remaining,
      error:
        `Verification failed: ${remaining.length} non-trashed document variant(s) still reference ` +
        `${duplicateId}. Delete was skipped.`,
    }
  }

  await client.delete(duplicateId)

  return {
    dryRun: false,
    repointedDocuments,
    repointedPeople,
    canonicalFieldsPatched,
    verifiedClean: true,
    duplicateDeleted: true,
    trashedSkipped: plan.trashedReferences.length,
  }
}
