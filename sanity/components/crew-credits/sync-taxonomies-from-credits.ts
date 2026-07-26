/**
 * @deprecated Prefer creditIdentity linking via sync-credit-identities.ts
 * and migrate:patch:backfill-credit-identities / link-credit-identities.
 *
 * Sync portfolioEntry.clients / crewMembers from structured crewCredits.
 *
 * Brand → client refs (one per name)
 * Director / DOP / Art Director → crewMember refs (one per name, with role)
 *
 * Platforms are intentionally not synced — removed from Studio editing.
 */

import {normalizeCreditToken, type CrewCreditValue} from '@crew-credits'

function namesForRoleKey(
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

/** Sanity reference stub written onto portfolioEntry. */
export interface TaxonomyRef {
  _type: 'reference'
  _ref: string
  _key: string
}

export type CrewTaxonomyRole = 'director' | 'dop' | 'art-director'

export interface ExistingClientDoc {
  _id: string
  name: string
  slug?: string
}

export interface ExistingCrewMemberDoc {
  _id: string
  name: string
  slug?: string
  role: CrewTaxonomyRole
}

export interface TaxonomySyncPlan {
  /** Display names from Brand credits (order preserved, de-duped). */
  clientNames: string[]
  /** Display names per crew role from credits. */
  crewByRole: Record<CrewTaxonomyRole, string[]>
}

const CREW_CREDIT_ROLE_TO_TAXONOMY: Array<{
  roleKey: string
  taxonomyRole: CrewTaxonomyRole
}> = [
  {roleKey: 'director', taxonomyRole: 'director'},
  {roleKey: 'dop', taxonomyRole: 'dop'},
  {roleKey: 'art_director', taxonomyRole: 'art-director'},
]

/** Slug used for client / crewMember document IDs and filter matching. */
export function slugifyPersonName(name: string): string {
  // Keep in sync with work-internal toFilterSlug — Vietnamese Đ/đ → d.
  return name
    .replace(/đ/gi, 'd')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function clientDocumentId(slug: string): string {
  return `client-${slug}`
}

export function crewMemberDocumentId(role: CrewTaxonomyRole, slug: string): string {
  return `crew-${role}-${slug}`
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of names) {
    const name = raw.trim()
    if (!name) continue
    const key = normalizeCreditToken(name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}

/**
 * Collect Brand / Director / DOP / Art Director names from crewCredits.
 * Multiple people in one role become multiple taxonomy tags.
 */
export function planTaxonomySyncFromCredits(
  credits: CrewCreditValue[] | undefined,
): TaxonomySyncPlan {
  const clientNames = uniqueNames(namesForRoleKey(credits, 'brand'))

  const crewByRole: Record<CrewTaxonomyRole, string[]> = {
    director: [],
    dop: [],
    'art-director': [],
  }

  for (const {roleKey, taxonomyRole} of CREW_CREDIT_ROLE_TO_TAXONOMY) {
    crewByRole[taxonomyRole] = uniqueNames(namesForRoleKey(credits, roleKey))
  }

  return {clientNames, crewByRole}
}

function findClientDoc(
  name: string,
  existing: ExistingClientDoc[],
): ExistingClientDoc | undefined {
  const key = normalizeCreditToken(name)
  const slug = slugifyPersonName(name)
  return (
    existing.find((doc) => normalizeCreditToken(doc.name) === key) ??
    existing.find((doc) => (doc.slug ?? slugifyPersonName(doc.name)) === slug)
  )
}

function findCrewDoc(
  name: string,
  role: CrewTaxonomyRole,
  existing: ExistingCrewMemberDoc[],
): ExistingCrewMemberDoc | undefined {
  const key = normalizeCreditToken(name)
  const slug = slugifyPersonName(name)
  const sameRole = existing.filter((doc) => doc.role === role)
  return (
    sameRole.find((doc) => normalizeCreditToken(doc.name) === key) ??
    sameRole.find((doc) => (doc.slug ?? slugifyPersonName(doc.name)) === slug)
  )
}

function refKey(prefix: string, id: string): string {
  return `${prefix}-${id}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64)
}

export interface ResolvedTaxonomyPatch {
  clients: TaxonomyRef[]
  crewMembers: TaxonomyRef[]
  /** Documents to createIfNotExists before patching. */
  createClients: Array<{
    _id: string
    _type: 'client'
    name: string
    slug: {_type: 'slug'; current: string}
  }>
  createCrewMembers: Array<{
    _id: string
    _type: 'crewMember'
    name: string
    slug: {_type: 'slug'; current: string}
    role: CrewTaxonomyRole
  }>
}

/**
 * Resolve plan against existing docs; queue create payloads for missing terms.
 * Prefer existing document IDs so historical refs stay stable.
 */
export function resolveTaxonomyPatch(
  plan: TaxonomySyncPlan,
  existingClients: ExistingClientDoc[],
  existingCrew: ExistingCrewMemberDoc[],
): ResolvedTaxonomyPatch {
  const createClients: ResolvedTaxonomyPatch['createClients'] = []
  const createCrewMembers: ResolvedTaxonomyPatch['createCrewMembers'] = []
  const clients: TaxonomyRef[] = []
  const crewMembers: TaxonomyRef[] = []

  for (const name of plan.clientNames) {
    const slug = slugifyPersonName(name)
    if (!slug) continue
    const found = findClientDoc(name, existingClients)
    const id = found?._id ?? clientDocumentId(slug)
    if (!found) {
      createClients.push({
        _id: id,
        _type: 'client',
        name,
        slug: {_type: 'slug', current: slug},
      })
    }
    clients.push({_type: 'reference', _ref: id, _key: refKey('client', id)})
  }

  for (const role of ['director', 'dop', 'art-director'] as CrewTaxonomyRole[]) {
    for (const name of plan.crewByRole[role]) {
      const slug = slugifyPersonName(name)
      if (!slug) continue
      const found = findCrewDoc(name, role, existingCrew)
      const id = found?._id ?? crewMemberDocumentId(role, slug)
      if (!found) {
        createCrewMembers.push({
          _id: id,
          _type: 'crewMember',
          name,
          slug: {_type: 'slug', current: slug},
          role,
        })
      }
      crewMembers.push({
        _type: 'reference',
        _ref: id,
        _key: refKey('crew', id),
      })
    }
  }

  return {clients, crewMembers, createClients, createCrewMembers}
}

type SanitySyncClient = {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>
  createIfNotExists: (
    doc: {_id: string; _type: string} & Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => Promise<unknown>
  patch: (id: string) => {
    set: (attrs: Record<string, unknown>) => {
      commit: (options?: Record<string, unknown>) => Promise<unknown>
    }
  }
}

/**
 * Create missing taxonomy docs and set clients / crewMembers on the portfolio entry.
 * Skips the patch when refs are already in sync (avoids fighting Studio's document channel).
 */
export async function syncPortfolioTaxonomiesFromCredits(
  client: SanitySyncClient,
  documentId: string,
  credits: CrewCreditValue[] | undefined,
): Promise<{
  clients: number
  crewMembers: number
  created: number
  skipped: boolean
}> {
  const plan = planTaxonomySyncFromCredits(credits)

  const [existingClients, existingCrew, current] = await Promise.all([
    client.fetch<ExistingClientDoc[]>(
      `*[_type == "client"]{ _id, name, "slug": slug.current }`,
    ),
    client.fetch<ExistingCrewMemberDoc[]>(
      `*[_type == "crewMember"]{ _id, name, "slug": slug.current, role }`,
    ),
    client.fetch<{
      clients?: {_ref?: string}[]
      crewMembers?: {_ref?: string}[]
    } | null>(`*[_id == $id][0]{ clients[]{_ref}, crewMembers[]{_ref} }`, {
      id: documentId,
    }),
  ])

  const resolved = resolveTaxonomyPatch(plan, existingClients ?? [], existingCrew ?? [])

  const currentClientRefs = (current?.clients ?? [])
    .map((ref) => ref._ref)
    .filter(Boolean)
    .sort()
  const currentCrewRefs = (current?.crewMembers ?? [])
    .map((ref) => ref._ref)
    .filter(Boolean)
    .sort()
  const nextClientRefs = resolved.clients.map((ref) => ref._ref).sort()
  const nextCrewRefs = resolved.crewMembers.map((ref) => ref._ref).sort()

  const alreadySynced =
    currentClientRefs.length === nextClientRefs.length &&
    currentCrewRefs.length === nextCrewRefs.length &&
    currentClientRefs.every((id, index) => id === nextClientRefs[index]) &&
    currentCrewRefs.every((id, index) => id === nextCrewRefs[index])

  if (alreadySynced && !resolved.createClients.length && !resolved.createCrewMembers.length) {
    return {
      clients: resolved.clients.length,
      crewMembers: resolved.crewMembers.length,
      created: 0,
      skipped: true,
    }
  }

  for (const doc of resolved.createClients) {
    await client.createIfNotExists(doc)
  }
  for (const doc of resolved.createCrewMembers) {
    await client.createIfNotExists(doc)
  }

  if (!alreadySynced) {
    await client
      .patch(documentId)
      .set({
        clients: resolved.clients,
        crewMembers: resolved.crewMembers,
      })
      .commit({returnDocuments: false})
  }

  return {
    clients: resolved.clients.length,
    crewMembers: resolved.crewMembers.length,
    created: resolved.createClients.length + resolved.createCrewMembers.length,
    skipped: alreadySynced,
  }
}
