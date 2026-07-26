/**
 * creditIdentity resolve helpers — find/create by normalized name.
 *
 * Opaque `ci_…` ids are identity. Name matching is only for initial resolve.
 */

import {
  creditIdentityId,
  isFilterCreditRoleKey,
  normalizeCreditToken,
  type CrewCreditValue,
  type CrewPersonValue,
  type FilterCreditRoleKey,
} from '@crew-credits'

export interface CreditIdentityDoc {
  _id: string
  name: string
  url?: string
}


/** Sanity reference stub written onto crewPerson.identity. */
export interface IdentityRef {
  _type: 'reference'
  _ref: string
  _weak?: boolean
}

export function identityRef(id: string): IdentityRef {
  return {_type: 'reference', _ref: id, _weak: true}
}

export function findIdentityByName(
  name: string,
  existing: CreditIdentityDoc[],
): CreditIdentityDoc | undefined {
  const key = normalizeCreditToken(name)
  if (!key) return undefined
  return existing.find((doc) => normalizeCreditToken(doc.name) === key)
}

export function newCreditIdentityDoc(
  name: string,
  opts?: {url?: string; _id?: string},
): {_id: string; _type: 'creditIdentity'; name: string; url?: string} {
  const trimmed = name.trim()
  const url = opts?.url?.trim()
  return {
    _id: opts?._id ?? creditIdentityId(),
    _type: 'creditIdentity',
    name: trimmed,
    ...(url ? {url} : {}),
  }
}

export interface IdentitySyncPlan {
  /** Unique display names keyed by filter roleKey. */
  namesByRole: Record<FilterCreditRoleKey, string[]>
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

/** Collect unique names per filter role from crewCredits. */
export function planIdentitySyncFromCredits(
  credits: CrewCreditValue[] | undefined,
): IdentitySyncPlan {
  return {
    namesByRole: {
      brand: uniqueNames(namesForRoleKey(credits, 'brand')),
      director: uniqueNames(namesForRoleKey(credits, 'director')),
      dop: uniqueNames(namesForRoleKey(credits, 'dop')),
      art_director: uniqueNames(namesForRoleKey(credits, 'art_director')),
      editor: uniqueNames(namesForRoleKey(credits, 'editor')),
    },
  }
}

export interface LinkedPersonPatch {
  personKey?: string
  roleKey: FilterCreditRoleKey
  name: string
  identityId: string
  created?: boolean
}

export interface ResolvedIdentityLinkPlan {
  /** Documents to createIfNotExists before patching people. */
  createIdentities: Array<{
    _id: string
    _type: 'creditIdentity'
    name: string
    url?: string
  }>
  /** People slots that need an identity ref (and maybe name sync). */
  links: LinkedPersonPatch[]
  /** Updated crewCredits with identity refs attached where missing. */
  nextCredits: CrewCreditValue[]
}

/**
 * Attach identity refs to filter-role people; queue creates for unknown names.
 * Prefer existing identity docs matched by normalized name.
 */
export function resolveIdentityLinksOnCredits(
  credits: CrewCreditValue[] | undefined,
  existing: CreditIdentityDoc[],
): ResolvedIdentityLinkPlan {
  const createIdentities: ResolvedIdentityLinkPlan['createIdentities'] = []
  const links: LinkedPersonPatch[] = []
  const known = [...existing]
  const pendingByName = new Map<string, string>()

  function resolveId(name: string, url?: string): {id: string; created: boolean} {
    const key = normalizeCreditToken(name)
    const found = findIdentityByName(name, known)
    if (found) return {id: found._id, created: false}

    const pending = pendingByName.get(key)
    if (pending) return {id: pending, created: true}

    const doc = newCreditIdentityDoc(name, {url})
    createIdentities.push(doc)
    known.push({_id: doc._id, name: doc.name, url: doc.url})
    pendingByName.set(key, doc._id)
    return {id: doc._id, created: true}
  }

  const nextCredits: CrewCreditValue[] = (credits ?? []).map((credit) => {
    const roleKey = credit.roleKey
    if (!isFilterCreditRoleKey(roleKey)) {
      return credit
    }

    const people = (credit.people ?? []).map((person) => {
      const name = person.name?.trim()
      if (!name) return person

      if (person.identity?._ref) {
        links.push({
          personKey: person._key,
          roleKey,
          name,
          identityId: person.identity._ref,
          created: false,
        })
        return person
      }

      const {id, created} = resolveId(name, person.url)
      links.push({
        personKey: person._key,
        roleKey,
        name,
        identityId: id,
        created,
      })

      const next: CrewPersonValue = {
        ...person,
        identity: identityRef(id),
      }
      return next
    })

    return {...credit, people}
  })

  return {createIdentities, links, nextCredits}
}

function creditsEqualForIdentity(
  a: CrewCreditValue[] | undefined,
  b: CrewCreditValue[],
): boolean {
  const left = a ?? []
  if (left.length !== b.length) return false
  for (let i = 0; i < left.length; i++) {
    const lp = left[i]?.people ?? []
    const rp = b[i]?.people ?? []
    if (lp.length !== rp.length) return false
    for (let j = 0; j < lp.length; j++) {
      if ((lp[j]?.identity?._ref ?? '') !== (rp[j]?.identity?._ref ?? '')) {
        return false
      }
    }
  }
  return true
}

type SanityIdentityClient = {
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
 * Create missing creditIdentity docs and attach refs on filter-role people.
 * Skips the portfolio patch when refs are already in sync.
 */
export async function syncCreditIdentitiesOnPortfolio(
  client: SanityIdentityClient,
  documentId: string,
  credits: CrewCreditValue[] | undefined,
): Promise<{
  linked: number
  created: number
  skipped: boolean
}> {
  const existing = await client.fetch<CreditIdentityDoc[]>(
    `*[_type == "creditIdentity"]{ _id, name, url }`,
  )

  const resolved = resolveIdentityLinksOnCredits(credits, existing ?? [])

  if (
    creditsEqualForIdentity(credits, resolved.nextCredits) &&
    !resolved.createIdentities.length
  ) {
    return {
      linked: resolved.links.length,
      created: 0,
      skipped: true,
    }
  }

  for (const doc of resolved.createIdentities) {
    await client.createIfNotExists(doc)
  }

  if (!creditsEqualForIdentity(credits, resolved.nextCredits)) {
    await client
      .patch(documentId)
      .set({crewCredits: resolved.nextCredits})
      .commit({returnDocuments: false})
  }

  return {
    linked: resolved.links.length,
    created: resolved.createIdentities.length,
    skipped: false,
  }
}
