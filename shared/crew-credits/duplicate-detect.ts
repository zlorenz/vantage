/**
 * Potential-duplicate detection for Crew Members (creditIdentity).
 *
 * Paths:
 * 1. Exact-name clusters — same normalizeCreditToken, 2+ distinct ids
 * 2. Spacing clusters — same space-stripped norm, different norms
 *    (first-token buckets miss these: "nteam" vs "n team")
 * 3. Scoped near-miss — matchReasonsBetween + conservative typo
 *    (edit distance ≤1, min norm length ≥14) within first-token buckets
 *    (never full O(n²))
 *
 * Dismissals (duplicateDismissal.pairKey) permanently suppress a pair.
 * Role/vendor-append matching is intentionally out of scope.
 */

import {levenshtein} from './edit-distance'
import {normalizeCreditToken} from './normalize'
import {
  confidenceForReasons,
  matchReasonsBetween,
  type MatchConfidence,
  type MatchReason,
} from './name-match'
import type {CrewDepartmentKey} from './types'

/** Min normalized length for typo (edit-distance ≤1) near-miss. */
const TYPO_MIN_NORM_LENGTH = 14

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
  /**
   * Reserved for a future department-scoped near-miss pass.
   * v1 scopes near-miss by first normalized name token only.
   */
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
  void options.identityDepartmentsById

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

  // --- Spacing clusters (O(n) buckets; not first-token) --------------------
  // "NTeam"/"N Team" normalize to different first tokens, so near-miss
  // bucketing never compares them — cluster by space-stripped norm instead.
  const bySpacing = new Map<string, typeof rows>()
  for (const row of rows) {
    const key = row.norm.replace(/ /g, '')
    if (!key) continue
    const group = bySpacing.get(key) ?? []
    group.push(row)
    bySpacing.set(key, group)
  }
  for (const group of bySpacing.values()) {
    if (group.length < 2) continue
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const left = group[i]!
        const right = group[j]!
        if (left.norm === right.norm) continue // exact path already covers
        const reasons = matchReasonsBetween(left.name, right.name, {
          aCount: 1,
          bCount: 1,
          aUrls: [],
          bUrls: [],
        })
        if (!reasons.includes('spacing')) continue
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

    const reasons: MatchReason[] = matchReasonsBetween(left.name, right.name, {
      aCount: 1,
      bCount: 1,
      aUrls: [],
      bUrls: [],
    })

    // Conservative typo: dist ≤1 on long names only (scoped bucket already).
    const minLen = Math.min(left.norm.length, right.norm.length)
    if (
      minLen >= TYPO_MIN_NORM_LENGTH &&
      levenshtein(left.norm, right.norm) <= 1 &&
      !reasons.includes('typo')
    ) {
      reasons.push('typo')
    }

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

  // Department-scoped cross-token near-miss is intentionally omitted in v1 —
  // first-token buckets catch nickname/diacritic cases at ~O(bucket²) cost.

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
