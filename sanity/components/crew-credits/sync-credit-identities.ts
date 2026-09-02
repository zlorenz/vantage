/**
 * creditIdentity resolve helpers — find/create by normalized name.
 *
 * Opaque `ci_…` ids are identity. Name matching is only for initial resolve.
 */

import {
  applyPersonRenameToCredits,
  creditIdentityId,
  CREW_DEPARTMENTS,
  FILTER_CREDIT_ROLE_KEYS,
  findIdentityByNameWithConfidence,
  isAutoLinkConfidence,
  normalizeCreditToken,
  type CrewCreditValue,
  type CrewDepartmentKey,
  type CrewPersonValue,
  type FilterCreditRoleKey,
  type IdentityMatchConfidence,
} from '@crew-credits'

export interface CreditIdentityDoc {
  _id: string
  name: string
  url?: string
}

/** Which standard (non-custom) roleKeys may receive creditIdentity links. */
export type IdentityLinkPolicy = {
  roleKeys: ReadonlySet<string>
}

export const FILTER_CREDIT_IDENTITY_LINK_POLICY: IdentityLinkPolicy = {
  roleKeys: new Set<string>(FILTER_CREDIT_ROLE_KEYS),
}

/**
 * Departments whose standard (non-custom) roles all receive creditIdentity links
 * after batch apply. Studio inline linking + confidence gating use the same scope
 * via studioInlineIdentityLinkPolicy() — add a department here when its apply ships.
 */
export const FULL_IDENTITY_LINK_DEPARTMENTS: readonly CrewDepartmentKey[] = [
  'stills',
  'casting',
  'ge',
  'camera',
  'art',
]

/**
 * Role keys that receive Studio inline identity linking and confidence gating:
 * filter-five Work Library roles (partial production/camera/art/post) plus every
 * standard role in FULL_IDENTITY_LINK_DEPARTMENTS.
 */
export function studioInlineIdentityLinkPolicy(): IdentityLinkPolicy {
  const roleKeys = new Set<string>(FILTER_CREDIT_ROLE_KEYS)
  for (const department of FULL_IDENTITY_LINK_DEPARTMENTS) {
    for (const key of identityLinkPolicyForDepartments([department]).roleKeys) {
      roleKeys.add(key)
    }
  }
  return {roleKeys}
}

export function isStudioIdentityLinkedRoleKey(roleKey: string | undefined): boolean {
  return Boolean(roleKey && studioInlineIdentityLinkPolicy().roleKeys.has(roleKey))
}

/** Standard catalog roleKeys for the given departments (excludes custom roles at apply time). */
export function identityLinkPolicyForDepartments(
  departments: readonly CrewDepartmentKey[],
): IdentityLinkPolicy {
  const deptSet = new Set(departments)
  const roleKeys = CREW_DEPARTMENTS.filter((dept) => deptSet.has(dept.key)).flatMap((dept) =>
    dept.roles.map((role) => role.key),
  )
  return {roleKeys: new Set(roleKeys)}
}

export function creditMatchesIdentityLinkPolicy(
  credit: CrewCreditValue,
  policy: IdentityLinkPolicy,
): boolean {
  if (credit.isCustomRole) return false
  const roleKey = credit.roleKey
  return Boolean(roleKey && policy.roleKeys.has(roleKey))
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
    if (credit.isCustomRole) continue
    if (credit.roleKey !== roleKey) continue
    for (const person of credit.people ?? []) {
      const name = person.name?.trim()
      if (name) names.push(name)
    }
  }
  return names
}

function planNamesByRoleForPolicy(
  credits: CrewCreditValue[] | undefined,
  policy: IdentityLinkPolicy,
): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const roleKey of policy.roleKeys) {
    out[roleKey] = uniqueNames(namesForRoleKey(credits, roleKey))
  }
  return out
}

/** Collect unique names per filter role from crewCredits. */
export function planIdentitySyncFromCredits(
  credits: CrewCreditValue[] | undefined,
): IdentitySyncPlan {
  const namesByRole = planNamesByRoleForPolicy(
    credits,
    FILTER_CREDIT_IDENTITY_LINK_POLICY,
  )
  return {
    namesByRole: {
      brand: namesByRole.brand ?? [],
      director: namesByRole.director ?? [],
      dop: namesByRole.dop ?? [],
      art_director: namesByRole.art_director ?? [],
      editor: namesByRole.editor ?? [],
    },
  }
}

/** Collect unique names per roleKey for an arbitrary link policy. */
export function planIdentityNamesByRole(
  credits: CrewCreditValue[] | undefined,
  policy: IdentityLinkPolicy,
): Record<string, string[]> {
  return planNamesByRoleForPolicy(credits, policy)
}

export interface LinkedPersonPatch {
  personKey?: string
  roleKey: string
  name: string
  identityId: string
  created?: boolean
  confidence?: IdentityMatchConfidence
}

export interface ReviewLinkPersonPatch {
  personKey?: string
  roleKey: string
  department: CrewDepartmentKey
  name: string
  portfolioId?: string
  portfolioLabel?: string
  candidateIdentityId: string
  candidateIdentityName: string
  candidateIdentityDepartments: CrewDepartmentKey[]
  confidence: 'review'
}

export interface ResolveIdentityLinksOptions {
  /** Departments each identity is already linked in — from buildIdentityDepartmentUsageFromCredits. */
  identityDepartmentsById?: ReadonlyMap<string, ReadonlySet<CrewDepartmentKey>>
  portfolioId?: string
  portfolioLabel?: string
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
  /** Normalized matches that were skipped pending manual review. */
  reviewLinks: ReviewLinkPersonPatch[]
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
  policy: IdentityLinkPolicy = FILTER_CREDIT_IDENTITY_LINK_POLICY,
  options: ResolveIdentityLinksOptions = {},
): ResolvedIdentityLinkPlan {
  const createIdentities: ResolvedIdentityLinkPlan['createIdentities'] = []
  const links: LinkedPersonPatch[] = []
  const reviewLinks: ReviewLinkPersonPatch[] = []
  const known = [...existing]
  const pendingByName = new Map<string, string>()
  const identityDepartmentsById = options.identityDepartmentsById ?? new Map()

  type ResolveIdResult =
    | {kind: 'linked'; id: string; created: boolean; confidence?: IdentityMatchConfidence}
    | {kind: 'review'; candidate: Omit<ReviewLinkPersonPatch, 'personKey' | 'roleKey' | 'name' | 'department'>}

  function resolveId(
    name: string,
    url: string | undefined,
    slotDepartment: CrewDepartmentKey,
  ): ResolveIdResult {
    const key = normalizeCreditToken(name)
    const match = findIdentityByNameWithConfidence(name, known, {
      slotDepartment,
      identityDepartmentsById,
    })

    if (match && isAutoLinkConfidence(match.confidence)) {
      return {
        kind: 'linked',
        id: match.identity._id,
        created: false,
        confidence: match.confidence,
      }
    }

    if (match?.confidence === 'review') {
      const candidateDepartments = [
        ...(identityDepartmentsById.get(match.identity._id) ?? []),
      ].sort()
      return {
        kind: 'review',
        candidate: {
          portfolioId: options.portfolioId,
          portfolioLabel: options.portfolioLabel,
          candidateIdentityId: match.identity._id,
          candidateIdentityName: match.identity.name,
          candidateIdentityDepartments: candidateDepartments,
          confidence: 'review',
        },
      }
    }

    const pending = pendingByName.get(key)
    if (pending) return {kind: 'linked', id: pending, created: true}

    const doc = newCreditIdentityDoc(name, {url})
    createIdentities.push(doc)
    known.push({_id: doc._id, name: doc.name, url: doc.url})
    pendingByName.set(key, doc._id)
    return {kind: 'linked', id: doc._id, created: true}
  }

  const nextCredits: CrewCreditValue[] = (credits ?? []).map((credit) => {
    if (!creditMatchesIdentityLinkPolicy(credit, policy)) {
      return credit
    }

    const roleKey = credit.roleKey!
    const slotDepartment = credit.department
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

      const resolved = resolveId(name, person.url, slotDepartment)
      if (resolved.kind === 'review') {
        reviewLinks.push({
          personKey: person._key,
          roleKey,
          department: slotDepartment,
          name,
          ...resolved.candidate,
        })
        return person
      }

      const {id, created, confidence} = resolved
      links.push({
        personKey: person._key,
        roleKey,
        name,
        identityId: id,
        created,
        ...(confidence ? {confidence} : {}),
      })

      let next: CrewPersonValue = {
        ...person,
        identity: identityRef(id),
      }
      if (!created) {
        const identity = known.find((row) => row._id === id)
        if (identity?.name) {
          const {credits: renamed} = applyPersonRenameToCredits(
            [{...credit, people: [next]}],
            {fromName: '', toName: identity.name, identityId: id},
          )
          const renamedPerson = renamed[0]?.people?.[0]
          if (renamedPerson) next = renamedPerson
        }
      }
      return next
    })

    return {...credit, people}
  })

  return {createIdentities, links, reviewLinks, nextCredits}
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
