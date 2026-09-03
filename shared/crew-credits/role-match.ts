/**
 * Fuzzy / near-match suggestions for crew role labels (CSV import Confirm/Skip).
 */

import {CREW_ROLES_FLAT, type ResolvedCrewRole} from './catalog'
import {levenshtein} from './edit-distance'
import {
  normalizeCreditToken,
  resolveCustomRoleCanonical,
  resolveStandardRole,
  type ResolveStandardRoleOptions,
} from './normalize'
import type {CrewDepartmentKey} from './types'

export type RoleMatchConfidence = 'high' | 'medium'

export type RoleMatchKind = 'standard' | 'custom_canonical'

export interface RoleMatch {
  kind: RoleMatchKind
  confidence: RoleMatchConfidence
  /** Display label for the suggested role. */
  label: string
  roleKey?: string
  departmentKey?: CrewDepartmentKey
  /** Why this was suggested. */
  reason: string
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeCreditToken(value).split(' ').filter(Boolean))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let intersection = 0
  for (const t of a) {
    if (b.has(t)) intersection++
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

function candidatesFor(entry: ResolvedCrewRole): string[] {
  return [
    entry.role.key,
    entry.role.label,
    entry.role.pluralLabel,
    ...entry.role.aliases,
  ]
}

/**
 * Suggest a catalog or custom-canonical role when exact resolveStandardRole misses.
 * Exact catalog hits return null (caller already mapped them).
 */
export function findRoleMatch(
  raw: string | undefined | null,
  options?: ResolveStandardRoleOptions,
): RoleMatch | null {
  if (!raw?.trim()) return null

  const exact = resolveStandardRole(raw, options)
  if (exact) return null

  const customCanonical = resolveCustomRoleCanonical(raw)
  if (customCanonical) {
    return {
      kind: 'custom_canonical',
      confidence: 'high',
      label: customCanonical,
      reason: 'known custom role variant',
    }
  }

  const normalized = normalizeCreditToken(raw)
  const rawTokens = tokenSet(raw)
  let best: {entry: ResolvedCrewRole; score: number; reason: string} | null = null

  for (const entry of CREW_ROLES_FLAT) {
    if (options?.department && entry.departmentKey !== options.department) {
      // Prefer same-department matches; still allow cross-dept at lower score below.
    }

    for (const candidate of candidatesFor(entry)) {
      const candNorm = normalizeCreditToken(candidate)
      if (!candNorm) continue

      if (candNorm.includes(normalized) || normalized.includes(candNorm)) {
        const containmentScore =
          Math.min(normalized.length, candNorm.length) /
          Math.max(normalized.length, candNorm.length)
        if (containmentScore >= 0.6) {
          const deptBonus =
            options?.department && entry.departmentKey === options.department ? 0.15 : 0
          const score = 0.75 + containmentScore * 0.2 + deptBonus
          if (!best || score > best.score) {
            best = {entry, score, reason: 'label containment'}
          }
        }
      }

      const jac = jaccard(rawTokens, tokenSet(candidate))
      if (jac >= 0.66) {
        const deptBonus =
          options?.department && entry.departmentKey === options.department ? 0.1 : 0
        const score = 0.55 + jac * 0.35 + deptBonus
        if (!best || score > best.score) {
          best = {entry, score, reason: 'shared tokens'}
        }
      }

      if (Math.abs(candNorm.length - normalized.length) <= 4) {
        const dist = levenshtein(normalized, candNorm)
        const maxLen = Math.max(normalized.length, candNorm.length)
        if (maxLen > 0 && dist / maxLen <= 0.25 && dist <= 3) {
          const deptBonus =
            options?.department && entry.departmentKey === options.department ? 0.1 : 0
          const score = 0.7 - dist * 0.08 + deptBonus
          if (!best || score > best.score) {
            best = {entry, score, reason: 'similar spelling'}
          }
        }
      }
    }
  }

  if (!best || best.score < 0.72) return null

  return {
    kind: 'standard',
    confidence: best.score >= 0.85 ? 'high' : 'medium',
    label: best.entry.role.label,
    roleKey: best.entry.role.key,
    departmentKey: best.entry.departmentKey,
    reason: best.reason,
  }
}
