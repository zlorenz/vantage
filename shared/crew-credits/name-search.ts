/**
 * Typeahead search over crew name catalogs for Studio autocomplete.
 */

import {
  confidenceForReasons,
  matchReasonsBetween,
  normName,
  type MatchReason,
  type NameCatalogEntry,
} from './name-match'

export type NameSuggestionMatchKind =
  | 'exact'
  | 'prefix'
  | 'word_prefix'
  | 'substring'
  | 'fuzzy'

export interface NameSuggestion {
  name: string
  count: number
  url?: string
  linkTitle?: string
  matchKind: NameSuggestionMatchKind
  inRole: boolean
  reasons?: MatchReason[]
}

const MATCH_KIND_RANK: Record<NameSuggestionMatchKind, number> = {
  exact: 0,
  prefix: 1,
  word_prefix: 2,
  substring: 3,
  fuzzy: 4,
}

function classifySubstringMatch(
  queryNorm: string,
  nameNorm: string,
  words: string[],
): NameSuggestionMatchKind | null {
  if (nameNorm === queryNorm) return 'exact'
  if (nameNorm.startsWith(queryNorm)) return 'prefix'
  if (words.some((word) => word.startsWith(queryNorm))) return 'word_prefix'
  if (nameNorm.includes(queryNorm)) return 'substring'
  if (words.some((word) => word.includes(queryNorm))) return 'substring'
  return null
}

function mergeEntry(
  existing: NameSuggestion | undefined,
  next: NameSuggestion,
): NameSuggestion {
  if (!existing) return next
  if (MATCH_KIND_RANK[next.matchKind] < MATCH_KIND_RANK[existing.matchKind]) return next
  if (MATCH_KIND_RANK[next.matchKind] > MATCH_KIND_RANK[existing.matchKind]) return existing
  if (next.inRole && !existing.inRole) return next
  if (!next.inRole && existing.inRole) return existing
  if (next.count > existing.count) return next
  return existing
}

function entryToSuggestion(
  entry: NameCatalogEntry,
  matchKind: NameSuggestionMatchKind,
  inRole: boolean,
  reasons?: MatchReason[],
): NameSuggestion {
  return {
    name: entry.name,
    count: entry.count,
    matchKind,
    inRole,
    ...(entry.url ? {url: entry.url} : {}),
    ...(entry.linkTitle ? {linkTitle: entry.linkTitle} : {}),
    ...(reasons?.length ? {reasons} : {}),
  }
}

function scanCatalog(
  catalog: NameCatalogEntry[],
  query: string,
  queryNorm: string,
  inRole: boolean,
  results: Map<string, NameSuggestion>,
) {
  for (const entry of catalog) {
    const name = entry.name.trim()
    if (!name) continue

    const nameNorm = normName(name)
    const words = nameNorm.split(/\s+/).filter(Boolean)

    const substringKind = classifySubstringMatch(queryNorm, nameNorm, words)
    if (substringKind) {
      const key = nameNorm
      results.set(
        key,
        mergeEntry(
          results.get(key),
          entryToSuggestion(entry, substringKind, inRole),
        ),
      )
      continue
    }

    const reasons = matchReasonsBetween(query, name, {
      aCount: 1,
      bCount: entry.count,
      aUrls: [],
      bUrls: entry.url ? [entry.url] : [],
    })
    if (!reasons.length) continue

    const confidence = confidenceForReasons(reasons, [{name: query}, {name}])
    if (confidence === 'review') continue

    const key = nameNorm
    results.set(
      key,
      mergeEntry(
        results.get(key),
        entryToSuggestion(entry, 'fuzzy', inRole, reasons),
      ),
    )
  }
}

/**
 * Search site-wide and role-scoped catalogs for autocomplete suggestions.
 */
export function searchNameSuggestions(
  query: string,
  opts: {
    siteCatalog: NameCatalogEntry[]
    roleCatalog?: NameCatalogEntry[]
    excludeNames?: string[]
    limit?: number
  },
): NameSuggestion[] {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const {siteCatalog, roleCatalog, excludeNames = [], limit = 8} = opts
  if (!siteCatalog.length && !roleCatalog?.length) return []

  const queryNorm = normName(trimmed)
  const excluded = new Set(excludeNames.map((name) => normName(name)))

  const results = new Map<string, NameSuggestion>()

  if (roleCatalog?.length) {
    scanCatalog(roleCatalog, trimmed, queryNorm, true, results)
  }
  scanCatalog(siteCatalog, trimmed, queryNorm, false, results)

  return [...results.values()]
    .filter((suggestion) => !excluded.has(normName(suggestion.name)))
    .sort((a, b) => {
      if (a.inRole !== b.inRole) return a.inRole ? -1 : 1
      const kindDiff = MATCH_KIND_RANK[a.matchKind] - MATCH_KIND_RANK[b.matchKind]
      if (kindDiff !== 0) return kindDiff
      if (b.count !== a.count) return b.count - a.count
      return b.name.length - a.name.length
    })
    .slice(0, limit)
}
