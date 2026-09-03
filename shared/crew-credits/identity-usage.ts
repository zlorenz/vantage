/**
 * Portfolio usage counts for creditIdentity documents.
 *
 * Matching rules (identity ref, display-name fallback, art-director /
 * production-designer alias) are shared by `portfolioMatchesIdentityRole`
 * and `resolveUsageForIdentities`. Which portfolios are in scope is
 * determined by the GROQ query the caller fetches — see
 * `IDENTITY_USAGE_PORTFOLIOS_STUDIO_QUERY` (Studio "Used by") vs
 * `IDENTITY_USAGE_PORTFOLIOS_PUBLIC_QUERY` (public facet / work-internal
 * `visibility: 'public'` parity).
 *
 * **Not a raw `references()` count.** GROQ `references(identityId)` totals
 * every weak ref on any role (including trashed portfolios). These queries
 * count only the caller's role-key set (default: FILTER_CREDIT_ROLE_KEYS).
 */

import {FILTER_CREDIT_ROLE_KEYS} from './types'

export type IdentityUsageRoleKey = string

export type IdentityUsagePerson = {
  name?: string
  identityId?: string
}

export type IdentityUsageCredit = {
  roleKey?: string
  isCustomRole?: boolean
  people?: IdentityUsagePerson[]
}

/** Minimal portfolio shape needed for usage counting. */
export type IdentityUsagePortfolio = {
  _id: string
  crewCredits?: IdentityUsageCredit[]
}

export type IdentityUsageResult = {
  /** Unique portfolios matching any counted role. */
  usage: number
  /** Unique portfolios matching each role. */
  usageByRole: Partial<Record<IdentityUsageRoleKey, number>>
  /** Roles where this identity appears (for Studio tab filters). */
  roleKeys: IdentityUsageRoleKey[]
}

export type ResolveUsageMatchMode = 'nameFallback' | 'identityRef'

export type ResolveUsageForIdentitiesOptions = {
  /** Role keys to index and aggregate; defaults to FILTER_CREDIT_ROLE_KEYS. */
  roleKeys?: readonly string[]
  /**
   * How people slots match an identity.
   * - `nameFallback` (default): identity ref OR display-name match (legacy /
   *   Work Library–style; can cross-contaminate when two identities share a name).
   * - `identityRef`: only slots with a direct identity._ref — Studio Crew
   *   Members Credits/Roles use this so name-collision twins stay distinct.
   */
  matchMode?: ResolveUsageMatchMode
}

function publishedPortfolioId(id: string): string {
  return id.replace(/^drafts\./, '')
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function namesEqual(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b)
}

function peopleForRole(
  entry: IdentityUsagePortfolio,
  roleKey: IdentityUsageRoleKey,
): IdentityUsagePerson[] {
  return (entry.crewCredits ?? [])
    .filter((credit) => credit.roleKey === roleKey && !credit.isCustomRole)
    .flatMap((credit) => credit.people ?? [])
}

function structuredRoleNames(
  entry: IdentityUsagePortfolio,
  roleKey: string,
): string[] {
  const names: string[] = []
  for (const credit of entry.crewCredits ?? []) {
    if (credit.roleKey !== roleKey) continue
    for (const person of credit.people ?? []) {
      const name = person.name?.trim()
      if (name) names.push(name)
    }
  }
  return names
}

type UsageIndex = {
  byIdentityRef: Map<string, Map<IdentityUsageRoleKey, Set<string>>>
  byNameAndRole: Map<string, Map<string, Set<string>>>
  productionDesignerNames: Map<string, Set<string>>
}

function buildUsageIndex(
  portfolios: IdentityUsagePortfolio[],
  roleSet: ReadonlySet<string>,
): UsageIndex {
  const byIdentityRef = new Map<string, Map<IdentityUsageRoleKey, Set<string>>>()
  const byNameAndRole = new Map<string, Map<string, Set<string>>>()
  const productionDesignerNames = new Map<string, Set<string>>()
  const trackProductionDesignerAlias = roleSet.has('art_director')

  for (const entry of portfolios) {
    const portfolioId = publishedPortfolioId(entry._id)

    for (const credit of entry.crewCredits ?? []) {
      const roleKey = credit.roleKey
      if (!roleKey) continue

      for (const person of credit.people ?? []) {
        const name = person.name?.trim()

        if (
          !credit.isCustomRole &&
          roleSet.has(roleKey) &&
          person.identityId
        ) {
          let roleMap = byIdentityRef.get(person.identityId)
          if (!roleMap) {
            roleMap = new Map()
            byIdentityRef.set(person.identityId, roleMap)
          }
          let portfoliosForRole = roleMap.get(roleKey)
          if (!portfoliosForRole) {
            portfoliosForRole = new Set()
            roleMap.set(roleKey, portfoliosForRole)
          }
          portfoliosForRole.add(portfolioId)
        }

        if (roleSet.has(roleKey) && name) {
          const normalized = normalizeName(name)
          let roleMap = byNameAndRole.get(normalized)
          if (!roleMap) {
            roleMap = new Map()
            byNameAndRole.set(normalized, roleMap)
          }
          let portfoliosForRole = roleMap.get(roleKey)
          if (!portfoliosForRole) {
            portfoliosForRole = new Set()
            roleMap.set(roleKey, portfoliosForRole)
          }
          portfoliosForRole.add(portfolioId)
        }

        if (trackProductionDesignerAlias && roleKey === 'production_designer' && name) {
          const normalized = normalizeName(name)
          let portfoliosForName = productionDesignerNames.get(normalized)
          if (!portfoliosForName) {
            portfoliosForName = new Set()
            productionDesignerNames.set(normalized, portfoliosForName)
          }
          portfoliosForName.add(portfolioId)
        }
      }
    }
  }

  return {byIdentityRef, byNameAndRole, productionDesignerNames}
}

/**
 * Whether a portfolio would match a Work Library filter for this identity + role.
 * Same rules as `matchesRoleFilter` for `ci_*` filter ids (identity or name).
 */
export function portfolioMatchesIdentityRole(
  entry: IdentityUsagePortfolio,
  identityId: string,
  displayName: string,
  roleKey: IdentityUsageRoleKey,
): boolean {
  if (!identityId) return false

  const people = peopleForRole(entry, roleKey)
  if (people.some((person) => person.identityId === identityId)) return true

  const needle = displayName.trim()
  if (!needle) return false

  if (structuredRoleNames(entry, roleKey).some((name) => namesEqual(name, needle))) {
    return true
  }

  // Art filter also matches Production Designer by display name.
  if (
    roleKey === 'art_director' &&
    structuredRoleNames(entry, 'production_designer').some((name) =>
      namesEqual(name, needle),
    )
  ) {
    return true
  }

  return false
}

/**
 * Compute usage for a known set of creditIdentity rows against portfolios.
 *
 * Callers choose the portfolio set via GROQ (Studio vs public facet query).
 * Matching logic is identical either way; only the input array differs.
 * Pass `matchMode: 'identityRef'` for Studio Credits/Roles (no name fallback).
 */
export function resolveUsageForIdentities(
  identities: Array<{_id: string; name: string}>,
  portfolios: IdentityUsagePortfolio[],
  options?: ResolveUsageForIdentitiesOptions,
): Map<string, IdentityUsageResult> {
  const roleKeys = options?.roleKeys ?? FILTER_CREDIT_ROLE_KEYS
  const matchMode = options?.matchMode ?? 'nameFallback'
  const useNameFallback = matchMode === 'nameFallback'
  const roleSet = new Set(roleKeys)
  const trackProductionDesignerAlias =
    useNameFallback && roleSet.has('art_director')
  const {byIdentityRef, byNameAndRole, productionDesignerNames} = buildUsageIndex(
    portfolios,
    roleSet,
  )
  const results = new Map<string, IdentityUsageResult>()

  for (const identity of identities) {
    const identityId = publishedPortfolioId(identity._id)
    const displayName = identity.name?.trim() ?? ''
    const usageByRole: Partial<Record<IdentityUsageRoleKey, number>> = {}
    const allPortfolioIds = new Set<string>()
    const matchedRoleKeys: IdentityUsageRoleKey[] = []

    const identityRoles = byIdentityRef.get(identityId)
    const nameRoles =
      useNameFallback && displayName
        ? byNameAndRole.get(normalizeName(displayName))
        : undefined
    const productionDesignerPortfolios =
      trackProductionDesignerAlias && displayName
        ? productionDesignerNames.get(normalizeName(displayName))
        : undefined

    for (const roleKey of roleKeys) {
      const matched = new Set<string>()

      identityRoles?.get(roleKey)?.forEach((portfolioId) => matched.add(portfolioId))

      if (useNameFallback && displayName) {
        nameRoles?.get(roleKey)?.forEach((portfolioId) => matched.add(portfolioId))
        if (roleKey === 'art_director') {
          productionDesignerPortfolios?.forEach((portfolioId) =>
            matched.add(portfolioId),
          )
        }
      }

      if (matched.size > 0) {
        usageByRole[roleKey] = matched.size
        matchedRoleKeys.push(roleKey)
        matched.forEach((portfolioId) => allPortfolioIds.add(portfolioId))
      }
    }

    results.set(identityId, {
      usage: allPortfolioIds.size,
      usageByRole,
      roleKeys: matchedRoleKeys,
    })
  }

  return results
}

/** GROQ projection for Studio / audits that feed `resolveUsageForIdentities`. */
export const IDENTITY_USAGE_PORTFOLIO_PROJECTION = `{
  _id,
  crewCredits[]{
    roleKey,
    isCustomRole,
    people[]{
      name,
      "identityId": identity._ref
    }
  }
}`

/**
 * Published public-facet rows — matches /work-internal `visibility: 'public'`
 * (excludes drafts, trash, and hidden). Not used by Studio today; kept for
 * audits or future parity checks.
 */
export const IDENTITY_USAGE_PORTFOLIOS_PUBLIC_QUERY = `*[
  _type == "portfolioEntry"
  && !(_id in path("drafts.**"))
  && !defined(trash.trashedAt)
  && isHidden != true
]${IDENTITY_USAGE_PORTFOLIO_PROJECTION}`

/**
 * Studio Crew Members "Used by" — all published, non-trashed portfolios
 * including hidden (`isHidden: true`). Intentionally broader than the public
 * facet query above; hidden projects are real credits, just unlisted.
 */
export const IDENTITY_USAGE_PORTFOLIOS_STUDIO_QUERY = `*[
  _type == "portfolioEntry"
  && !(_id in path("drafts.**"))
  && !defined(trash.trashedAt)
]${IDENTITY_USAGE_PORTFOLIO_PROJECTION}`
