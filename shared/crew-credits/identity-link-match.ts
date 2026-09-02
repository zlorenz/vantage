/**
 * Confidence-gated creditIdentity name matching for batch linking.
 *
 * Reuses CSV preview homonym logic (matchReasonsBetween + confidenceForReasons)
 * so cross-department normalized collisions are flagged for review instead of
 * silently merged.
 */

import {getDepartmentLabel} from './catalog'
import {normalizeCreditToken} from './normalize'
import {confidenceForReasons, matchReasonsBetween} from './name-match'
import type {CrewCreditValue, CrewDepartmentKey} from './types'

export type IdentityMatchConfidence = 'exact' | 'safe_casing' | 'safe_norm' | 'review'

/** Why a match was held for manual review (confidence is always `review`). */
export type IdentityMatchReviewReason =
  | 'cross_department_exact'
  | 'cross_department_spelling'
  | 'same_department_homonym'

export interface IdentityLinkCandidateDoc {
  _id: string
  name: string
}

export interface IdentityLinkMatchContext {
  slotDepartment: CrewDepartmentKey
  identityDepartmentsById: ReadonlyMap<string, ReadonlySet<CrewDepartmentKey>>
}

export interface IdentityMatchResult {
  identity: IdentityLinkCandidateDoc
  confidence: IdentityMatchConfidence
  /** Set when confidence is `review` — distinguishes department crossover from spelling ambiguity. */
  reviewReason?: IdentityMatchReviewReason
}

/** True when a match should receive an identity ref automatically. */
export function isAutoLinkConfidence(confidence: IdentityMatchConfidence): boolean {
  return confidence !== 'review'
}

/**
 * Scan linked crewCredits and collect which departments each identity appears in.
 * Build once per dry-run/apply batch and pass into resolveIdentityLinksOnCredits.
 */
export function buildIdentityDepartmentUsageFromCredits(
  portfolios: ReadonlyArray<{crewCredits?: CrewCreditValue[]}>,
): Map<string, Set<CrewDepartmentKey>> {
  const usage = new Map<string, Set<CrewDepartmentKey>>()

  for (const doc of portfolios) {
    for (const credit of doc.crewCredits ?? []) {
      const department = credit.department
      if (!department) continue
      for (const person of credit.people ?? []) {
        const identityId = person.identity?._ref
        if (!identityId) continue
        const departments = usage.get(identityId) ?? new Set<CrewDepartmentKey>()
        departments.add(department)
        usage.set(identityId, departments)
      }
    }
  }

  return usage
}

/** Orphan identities (no linked usage yet) may auto-link; otherwise slot dept must match. */
function departmentAllowsAutoLink(
  slotDepartment: CrewDepartmentKey,
  identityDepartments: ReadonlySet<CrewDepartmentKey> | undefined,
): boolean {
  const knownDepartments = identityDepartments ?? new Set<CrewDepartmentKey>()
  if (knownDepartments.size === 0) return true
  return knownDepartments.has(slotDepartment)
}

function classifyExactMatch(
  slotDepartment: CrewDepartmentKey,
  identityDepartments: ReadonlySet<CrewDepartmentKey> | undefined,
): Pick<IdentityMatchResult, 'confidence' | 'reviewReason'> {
  if (departmentAllowsAutoLink(slotDepartment, identityDepartments)) {
    return {confidence: 'exact'}
  }
  return {confidence: 'review', reviewReason: 'cross_department_exact'}
}

function classifyNormalizedMatch(
  slotName: string,
  identityName: string,
  slotDepartment: CrewDepartmentKey,
  identityDepartments: ReadonlySet<CrewDepartmentKey> | undefined,
): Pick<IdentityMatchResult, 'confidence' | 'reviewReason'> {
  const knownDepartments = identityDepartments ?? new Set<CrewDepartmentKey>()
  const sameDepartment = knownDepartments.size > 0 && knownDepartments.has(slotDepartment)
  if (!sameDepartment) {
    return {confidence: 'review', reviewReason: 'cross_department_spelling'}
  }

  const reasons = matchReasonsBetween(slotName, identityName)
  const matchConfidence = confidenceForReasons(reasons, [
    {name: slotName},
    {name: identityName},
  ])
  if (matchConfidence === 'review') {
    return {confidence: 'review', reviewReason: 'same_department_homonym'}
  }
  return {confidence: 'safe_norm'}
}

/** User-facing copy for review-queue rows and Studio inline link warnings. */
export function formatIdentityLinkReviewMessage(
  reviewReason: IdentityMatchReviewReason | undefined,
  options: {
    slotName: string
    candidateName: string
    candidateDepartments: readonly CrewDepartmentKey[]
  },
): string {
  if (reviewReason === 'cross_department_exact') {
    const deptLabels =
      options.candidateDepartments.length > 0
        ? options.candidateDepartments.map((dept) => getDepartmentLabel(dept)).join(', ')
        : 'another department'
    return (
      `Exact name match found in ${deptLabels} — confirm “${options.slotName}” ` +
      `is the same person as “${options.candidateName}” before linking`
    )
  }
  if (reviewReason === 'cross_department_spelling') {
    const deptLabels =
      options.candidateDepartments.length > 0
        ? options.candidateDepartments.map((dept) => getDepartmentLabel(dept)).join(', ')
        : 'another department'
    return (
      `Similar spelling to “${options.candidateName}” (${deptLabels}) — ` +
      'confirm before linking'
    )
  }
  return (
    `“${options.slotName}” looks similar to existing “${options.candidateName}” ` +
    '— confirm before linking'
  )
}

/**
 * Resolve a crewPerson name to an existing identity with link confidence.
 * Returns null when no normalized-name candidate exists in `existing`.
 */
export function findIdentityByNameWithConfidence(
  name: string,
  existing: readonly IdentityLinkCandidateDoc[],
  context: IdentityLinkMatchContext,
): IdentityMatchResult | null {
  const trimmed = name.trim()
  if (!trimmed) return null

  const key = normalizeCreditToken(trimmed)
  if (!key) return null

  const found = existing.find((doc) => normalizeCreditToken(doc.name) === key)
  if (!found) return null

  const identityName = found.name.trim()
  const identityDepartments = context.identityDepartmentsById.get(found._id)

  if (trimmed === identityName) {
    return {identity: found, ...classifyExactMatch(context.slotDepartment, identityDepartments)}
  }

  if (trimmed.toLowerCase() === identityName.toLowerCase()) {
    return {identity: found, confidence: 'safe_casing'}
  }

  return {
    identity: found,
    ...classifyNormalizedMatch(
      trimmed,
      identityName,
      context.slotDepartment,
      identityDepartments,
    ),
  }
}

/**
 * Evaluate link confidence for a specific identity candidate and slot name.
 * Returns null when the candidate is not a normalized-name match for the slot.
 */
export function evaluateIdentityLinkConfidence(
  slotName: string,
  candidateId: string,
  existing: readonly IdentityLinkCandidateDoc[],
  context: IdentityLinkMatchContext,
): IdentityMatchConfidence | null {
  const match = findIdentityByNameWithConfidence(slotName, existing, context)
  if (!match || match.identity._id !== candidateId) return null
  return match.confidence
}
