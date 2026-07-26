/**
 * Portfolio usage counts for creditIdentity documents.
 *
 * Mirrors /work-internal default facet matching (`matchesRoleFilter` +
 * `visibility: 'public'`):
 * - Count unique published, non-trashed, non-hidden portfolio entries
 * - Match by linked identity **or** same display name (transitional)
 * - Art Director also matches Production Designer by name
 *
 * Used by Sanity Studio Crew Members "Used by" so it stays aligned with
 * the Work Library filters.
 */

import {
  FILTER_CREDIT_ROLE_KEYS,
  type FilterCreditRoleKey,
} from './types'

export type IdentityUsageRoleKey = FilterCreditRoleKey

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
  /** Unique portfolios matching any filter role. */
  usage: number
  /** Unique portfolios matching each filter role. */
  usageByRole: Partial<Record<IdentityUsageRoleKey, number>>
  /** Roles where this identity appears (for Studio tab filters). */
  roleKeys: IdentityUsageRoleKey[]
}

function namesEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
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
 * Callers must pass the same portfolio set as /work-internal's default
 * public facet counts: published (no `drafts.*`), not trashed, not hidden.
 */
export function resolveUsageForIdentities(
  identities: Array<{_id: string; name: string}>,
  portfolios: IdentityUsagePortfolio[],
): Map<string, IdentityUsageResult> {
  const results = new Map<string, IdentityUsageResult>()

  for (const identity of identities) {
    const identityId = identity._id.replace(/^drafts\./, '')
    const displayName = identity.name?.trim() ?? ''
    const usageByRole: Partial<Record<IdentityUsageRoleKey, number>> = {}
    const allPortfolioIds = new Set<string>()
    const roleKeys: IdentityUsageRoleKey[] = []

    for (const roleKey of FILTER_CREDIT_ROLE_KEYS) {
      const matched = new Set<string>()
      for (const entry of portfolios) {
        const portfolioId = entry._id.replace(/^drafts\./, '')
        if (
          portfolioMatchesIdentityRole(entry, identityId, displayName, roleKey)
        ) {
          matched.add(portfolioId)
          allPortfolioIds.add(portfolioId)
        }
      }
      if (matched.size > 0) {
        usageByRole[roleKey] = matched.size
        roleKeys.push(roleKey)
      }
    }

    results.set(identityId, {
      usage: allPortfolioIds.size,
      usageByRole,
      roleKeys,
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
 * Published public library rows — matches /work-internal default facet counts
 * (`visibility: 'public'`). Excludes drafts, trash, and hidden entries.
 */
export const IDENTITY_USAGE_PORTFOLIOS_QUERY = `*[
  _type == "portfolioEntry"
  && !(_id in path("drafts.**"))
  && !defined(trash.trashedAt)
  && isHidden != true
]${IDENTITY_USAGE_PORTFOLIO_PROJECTION}`
