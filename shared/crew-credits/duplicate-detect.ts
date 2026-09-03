/**
 * Potential-duplicate detection for Crew Members (creditIdentity).
 *
 * Two paths:
 * 1. Exact-name clusters — same normalizeCreditToken, 2+ distinct ids
 * 2. Scoped near-miss — matchReasonsBetween within first-token buckets
 *    (and optional overlapping-department pairs), never full O(n²)
 *
 * Dismissals (duplicateDismissal.pairKey) permanently suppress a pair.
 * Typo / space-collapse variants (HKFilm, Gornostaev) are intentionally
 * out of scope for v1.
 */

import {normalizeCreditToken} from './normalize'
import {
  confidenceForReasons,
  matchReasonsBetween,
  type MatchConfidence,
  type MatchReason,
} from './name-match'
import type {CrewDepartmentKey} from './types'

export type DuplicateIdentityInput = {
  _id: string
  name: string
}

export type DuplicatePeerKind = 'exact_name' | 'near_miss'

export type DuplicatePeer = {
  identityId: string
  name: string
  kind: DuplicatePeerKind
  reasons: MatchReason[]
  confidence?: MatchConfidence
}

export type DuplicateFlag = {
  identityId: string
  name: string
  peers: DuplicatePeer[]
}

/** Canonical order-independent pair key for dismissal lookup. */
export function duplicatePairKey(identityA: string, identityB: string): string {
  return identityA < identityB ? `${identityA}|${identityB}` : `${identityB}|${identityA}`
}

function publishedId(id: string): string {
  return id.replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '')
}

function firstToken(norm: string): string {
  return norm.split(/\s+/).filter(Boolean)[0] ?? ''
}

export type FindPotentialDuplicatesOptions = {
  dismissedPairKeys?: ReadonlySet<string>
  /** Optional dept usage map — adds cross-bucket pairs that share a department. */
  identityDepartmentsById?: ReadonlyMap<string, ReadonlySet<CrewDepartmentKey>>
}

/**
 * Compute potential-duplicate flags for every identity that has ≥1 peer.
 * Returns a Map keyed by published identity id.
 */
export function findPotentialDuplicates(
  identities: readonly DuplicateIdentityInput[],
  options: FindPotentialDuplicatesOptions = {},
): Map<string, DuplicateFlag> {
  const dismissed = options.dismissedPairKeys ?? new Set<string>()
  const deptById = options.identityDepartmentsById

  const cleaned = identities
    .map((row) => ({
      _id: publishedId(row._id),
      name: row.name?.trim() ?? '',
      norm: normalizeCreditToken(row.name ?? ''),
    }))
    .filter((row) => row._id && row.name && row.norm)

  // Dedupe by id (prefer first)
  const byId = new Map<string, (typeof cleaned)[number]>()
  for (const row of cleaned) {
    if (!byId.has(row._id)) byId.set(row._id, row)
  }
  const rows = [...byId.values()]

  type Edge = {
    a: string
    b: string
    kind: DuplicatePeerKind
    reasons: MatchReason[]
    confidence?: MatchConfidence
  }
  const edges = new Map<string, Edge>()

  const addEdge = (edge: Edge) => {
    if (edge.a === edge.b) return
    const key = duplicatePairKey(edge.a, edge.b)
    if (dismissed.has(key)) return
    const existing = edges.get(key)
    // Prefer exact_name over near_miss for the same pair
    if (existing?.kind === 'exact_name') return
    edges.set(key, edge)
  }

  // --- Exact-name clusters -------------------------------------------------
  const byNorm = new Map<string, typeof rows>()
  for (const row of rows) {
    const group = byNorm.get(row.norm) ?? []
    group.push(row)
    byNorm.set(row.norm, group)
  }
  for (const group of byNorm.values()) {
    if (group.length < 2) continue
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        addEdge({
          a: group[i]!._id,
          b: group[j]!._id,
          kind: 'exact_name',
          reasons: [],
        })
      }
    }
  }

  // --- Scoped near-miss ----------------------------------------------------
  const byFirst = new Map<string, typeof rows>()
  for (const row of rows) {
    const token = firstToken(row.norm)
    if (!token) continue
    const group = byFirst.get(token) ?? []
    group.push(row)
    byFirst.set(token, group)
  }

  const considered = new Set<string>()

  const considerPair = (left: (typeof rows)[number], right: (typeof rows)[number]) => {
    if (left._id === right._id) return
    if (left.norm === right.norm) return // already exact-clustered
    const pair = duplicatePairKey(left._id, right._id)
    if (considered.has(pair)) return
    considered.add(pair)

    const reasons = matchReasonsBetween(left.name, right.name, {
      aCount: 1,
      bCount: 1,
      aUrls: [],
      bUrls: [],
    })
    if (!reasons.length) return
    const confidence = confidenceForReasons(reasons, [
      {name: left.name},
      {name: right.name},
    ])
    addEdge({
      a: left._id,
      b: right._id,
      kind: 'near_miss',
      reasons,
      confidence,
    })
  }

  for (const group of byFirst.values()) {
    if (group.length < 2) continue
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        considerPair(group[i]!, group[j]!)
      }
    }
  }

  // Extra pairs: same department, different first token (still scoped — not full n²)
  if (deptById?.size) {
    const byDept = new Map<CrewDepartmentKey, typeof rows>()
    for (const row of rows) {
      const depts = deptById.get(row._id)
      if (!depts?.size) continue
      for (const dept of depts) {
        const group = byDept.get(dept) ?? []
        group.push(row)
        byDept.set(dept, group)
      }
    }
    for (const group of byDept.values()) {
      if (group.length < 2) continue
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const left = group[i]!
          const right = group[j]!
          if (firstToken(left.norm) === firstToken(right.norm)) continue
          considerPair(left, right)
        }
      }
    }
  }

  // --- Build per-identity flags --------------------------------------------
  const flags = new Map<string, DuplicateFlag>()
  const nameById = new Map(rows.map((row) => [row._id, row.name]))

  const ensureFlag = (id: string): DuplicateFlag => {
    let flag = flags.get(id)
    if (!flag) {
      flag = {identityId: id, name: nameById.get(id) ?? '', peers: []}
      flags.set(id, flag)
    }
    return flag
  }

  for (const edge of edges.values()) {
    const nameA = nameById.get(edge.a) ?? ''
    const nameB = nameById.get(edge.b) ?? ''
    ensureFlag(edge.a).peers.push({
      identityId: edge.b,
      name: nameB,
      kind: edge.kind,
      reasons: edge.reasons,
      confidence: edge.confidence,
    })
    ensureFlag(edge.b).peers.push({
      identityId: edge.a,
      name: nameA,
      kind: edge.kind,
      reasons: edge.reasons,
      confidence: edge.confidence,
    })
  }

  for (const flag of flags.values()) {
    flag.peers.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'exact_name' ? -1 : 1
      return a.name.localeCompare(b.name, undefined, {sensitivity: 'base'})
    })
  }

  return flags
}
