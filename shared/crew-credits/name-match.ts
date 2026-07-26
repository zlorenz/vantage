/**
 * Fuzzy name matching for crew credit people.
 *
 * Used by:
 * - CSV import preview (flag variants vs site-wide catalog)
 * - Offline audit script (group variants in the database)
 */

import {CREW_ROLE_BY_KEY} from './catalog'
import {normalizeCreditToken} from './normalize'

export type MatchReason =
  | 'diacritic'
  | 'word_order'
  | 'shared_url'
  | 'nickname_prefix'
  | 'nickname_suffix'
  | 'hyphen_spacing'

export type MatchConfidence = 'high' | 'medium' | 'review'

export interface NameCatalogEntry {
  name: string
  count: number
  url?: string
  linkTitle?: string
  /** Display labels for crew roles this name appears in (e.g. DOP, Editor). */
  roles?: string[]
  /** Opaque creditIdentity _id when known. */
  identityId?: string
}

export interface NameMatch {
  canonical: string
  reasons: MatchReason[]
  confidence: 'high' | 'medium'
  count: number
  url?: string
  linkTitle?: string
  roles?: string[]
}

export interface NameStats {
  name: string
  count: number
  urls: string[]
  entries: string[]
}

const VIETNAMESE_DIACRITICS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/

export function normName(value: string): string {
  return normalizeCreditToken(value)
}

export function wordKey(name: string): string {
  return normName(name).split(/\s+/).filter(Boolean).sort().join(' ')
}

export function hyphenSpacingKey(name: string): string {
  return normName(name.replace(/-/g, ' '))
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim())
    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname.replace(/\/$/, '')}`.toLowerCase()
  } catch {
    return ''
  }
}

export function vietnameseDiacriticCount(name: string): number {
  return (name.match(new RegExp(VIETNAMESE_DIACRITICS.source, 'g')) ?? []).length
}

export function wordCount(name: string): number {
  return name.trim().split(/\s+/).filter(Boolean).length
}

export function looksVietnamesePersonName(name: string): boolean {
  if (name.includes('(') || name.includes('/') || name.includes('&')) return false
  if (VIETNAMESE_DIACRITICS.test(name)) return true
  const words = wordCount(name)
  if (words < 2) return false
  const norm = normName(name)
  const vietSurnames =
    /^(nguyen|tran|le|pham|hoang|huynh|phan|vu|vo|dang|bui|do|ngo|duong|ly|truong|dinh|mai|trinh|cao|lam|luong|thach|quach|ta|nghiem)/
  return vietSurnames.test(norm.split(/\s+/)[0] ?? '')
}

/** Prefer fullest native Vietnamese spelling; fall back to frequency for others. */
export function pickCanonical(variants: Array<{name: string; count: number}>): string {
  const vietnamese = variants.some((v) => looksVietnamesePersonName(v.name))

  return [...variants]
    .sort((a, b) => {
      if (vietnamese) {
        const aDiac = vietnameseDiacriticCount(a.name)
        const bDiac = vietnameseDiacriticCount(b.name)
        if (bDiac !== aDiac) return bDiac - aDiac

        const aWords = wordCount(a.name)
        const bWords = wordCount(b.name)
        if (bWords !== aWords) return bWords - aWords
      }

      if (b.count !== a.count) return b.count - a.count

      const aDiacritics = VIETNAMESE_DIACRITICS.test(a.name)
      const bDiacritics = VIETNAMESE_DIACRITICS.test(b.name)
      if (aDiacritics !== bDiacritics) return aDiacritics ? -1 : 1

      if (a.name.includes('(') !== b.name.includes('(')) {
        return a.name.includes('(') ? -1 : 1
      }

      return b.name.length - a.name.length
    })[0]!.name
}

export function isNicknamePrefix(shorter: string, longer: string): boolean {
  const sw = normName(shorter).split(/\s+/).filter(Boolean)
  const lw = normName(longer).split(/\s+/).filter(Boolean)
  if (!sw.length || sw.length >= lw.length) return false
  return lw.slice(0, sw.length).join(' ') === sw.join(' ')
}

export function isNicknameSuffix(shorter: string, longer: string): boolean {
  const sw = normName(shorter).split(/\s+/).filter(Boolean)
  const lw = normName(longer).split(/\s+/).filter(Boolean)
  if (!sw.length || sw.length >= lw.length || sw.length < 2) return false
  return lw.slice(-sw.length).join(' ') === sw.join(' ')
}

function nicknameAllowed(
  shorter: {name: string; count: number},
  longer: {name: string; count: number},
  prefix: boolean,
  suffix: boolean,
): boolean {
  const minCount = Math.min(shorter.count, longer.count)
  const total = shorter.count + longer.count
  const hasParenthetical = longer.name.includes('(')
  const shortIsSingleWord = normName(shorter.name).split(/\s+/).length === 1

  if (shortIsSingleWord && !hasParenthetical && minCount < 2 && total < 5) return false
  if (shortIsSingleWord && !prefix && suffix && total < 4) return false
  if (shortIsSingleWord && prefix && !hasParenthetical && longer.name.split(/\s+/).length > 3) {
    if (normName(shorter.name).length < 4 && total < 6) return false
  }
  return true
}

/** Collect match reasons between two display names (exact spelling never matches). */
export function matchReasonsBetween(
  a: string,
  b: string,
  opts?: {aCount?: number; bCount?: number; aUrls?: string[]; bUrls?: string[]},
): MatchReason[] {
  const left = a.trim()
  const right = b.trim()
  if (!left || !right || left === right) return []

  const reasons: MatchReason[] = []
  const aNorm = normName(left)
  const bNorm = normName(right)

  if (aNorm === bNorm) reasons.push('diacritic')

  const aWords = aNorm.split(/\s+/).filter(Boolean)
  const bWords = bNorm.split(/\s+/).filter(Boolean)
  if (aWords.length >= 2 && bWords.length >= 2 && wordKey(left) === wordKey(right) && aNorm !== bNorm) {
    reasons.push('word_order')
  }

  if (/[-\s]/.test(left) || /[-\s]/.test(right)) {
    if (hyphenSpacingKey(left) === hyphenSpacingKey(right) && aNorm !== bNorm) {
      reasons.push('hyphen_spacing')
    }
  }

  const aUrls = opts?.aUrls ?? []
  const bUrls = opts?.bUrls ?? []
  for (const url of aUrls) {
    const key = normalizeUrl(url)
    if (!key) continue
    if (bUrls.some((other) => normalizeUrl(other) === key)) {
      reasons.push('shared_url')
      break
    }
  }

  const shorter = left.length <= right.length ? left : right
  const longer = left.length > right.length ? left : right
  const shorterCount = left.length <= right.length ? (opts?.aCount ?? 1) : (opts?.bCount ?? 1)
  const longerCount = left.length > right.length ? (opts?.aCount ?? 1) : (opts?.bCount ?? 1)
  const prefix = isNicknamePrefix(shorter, longer)
  const suffix = isNicknameSuffix(shorter, longer)
  if (
    (prefix || suffix) &&
    nicknameAllowed(
      {name: shorter, count: shorterCount},
      {name: longer, count: longerCount},
      prefix,
      suffix,
    )
  ) {
    reasons.push(prefix ? 'nickname_prefix' : 'nickname_suffix')
  }

  return reasons
}

export function confidenceForReasons(
  reasons: MatchReason[],
  variants: Array<{name: string}>,
): MatchConfidence {
  if (!reasons.length) return 'review'

  const hasHigh = reasons.some((r) =>
    ['diacritic', 'word_order', 'shared_url', 'hyphen_spacing'].includes(r),
  )

  let confidence: MatchConfidence = hasHigh ? 'high' : 'medium'

  // Demote only when multiple accented first names fold to the same ASCII token
  // (e.g. Tú vs Tự). Plain ASCII vs accented (Tuyen vs Tuyển) stays high.
  if (reasons.includes('diacritic') && variants.length >= 2) {
    const firstNames = variants.map((v) => v.name.trim().split(/\s+/)[0] ?? '')
    const distinctFirstTokens = new Set(firstNames.map((name) => normName(name)))
    const rawFirstTokens = new Set(firstNames.map((name) => name.toLowerCase()))
    const accentedFirstNames = firstNames.filter((name) => /[^\u0000-\u007f]/.test(name))
    if (
      rawFirstTokens.size > 1 &&
      distinctFirstTokens.size === 1 &&
      accentedFirstNames.length >= 2
    ) {
      confidence = 'review'
    }
  }

  return confidence
}

/**
 * Exact catalog hit (same normalized spelling). Used to mark “known” names in
 * CSV preview — distinct from findNameMatch, which never returns exact equals.
 */
export function findExactNameInCatalog(
  rawName: string,
  catalog: NameCatalogEntry[],
): NameCatalogEntry | null {
  const input = rawName.trim()
  if (!input || !catalog.length) return null

  const exact = catalog.find((entry) => entry.name.trim() === input)
  if (exact) return exact

  const key = normName(input)
  if (!key) return null
  return catalog.find((entry) => normName(entry.name) === key) ?? null
}

/**
 * Find the best site-wide name that looks like a variant of the CSV name.
 * Exact same spelling (after trim) is never flagged.
 * Only high/medium confidence matches are returned.
 */
export function findNameMatch(
  csvName: string,
  catalog: NameCatalogEntry[],
): NameMatch | null {
  const input = csvName.trim()
  if (!input || !catalog.length) return null

  const candidates: Array<NameCatalogEntry & {reasons: MatchReason[]; confidence: 'high' | 'medium'}> =
    []

  for (const entry of catalog) {
    const known = entry.name.trim()
    if (!known || known === input) continue

    const reasons = matchReasonsBetween(input, known, {
      aCount: 1,
      bCount: entry.count,
      aUrls: [],
      bUrls: entry.url ? [entry.url] : [],
    })
    if (!reasons.length) continue

    const confidence = confidenceForReasons(reasons, [{name: input}, {name: known}])
    if (confidence === 'review') continue

    candidates.push({...entry, name: known, reasons, confidence})
  }

  if (!candidates.length) return null

  candidates.sort((a, b) => {
    const confRank = {high: 0, medium: 1}
    if (confRank[a.confidence] !== confRank[b.confidence]) {
      return confRank[a.confidence] - confRank[b.confidence]
    }
    if (b.count !== a.count) return b.count - a.count
    return b.name.length - a.name.length
  })

  const best = candidates[0]!
  const canonical = pickCanonical([
    {name: input, count: 1},
    {name: best.name, count: best.count},
  ])

  // Prefer the catalog spelling when it wins; otherwise still suggest the known name
  // so Confirm merges onto an existing system spelling.
  const preferred =
    canonical === input
      ? best.name
      : pickCanonical([{name: best.name, count: best.count}, {name: input, count: 1}])

  return {
    canonical: preferred === input ? best.name : preferred,
    reasons: best.reasons,
    confidence: best.confidence,
    count: best.count,
    ...(best.url ? {url: best.url} : {}),
    ...(best.linkTitle ? {linkTitle: best.linkTitle} : {}),
    ...(best.roles?.length ? {roles: best.roles} : {}),
  }
}

export interface CreditRowForNameCatalog {
  roleKey?: string
  role?: string
  isCustomRole?: boolean
  people?: Array<{
    name?: string
    url?: string
    linkTitle?: string
    identity?: {_ref?: string}
    identityId?: string
  }>
}

/** Resolve the display role label stored on a crew credit row. */
export function resolveCreditRoleLabel(credit: CreditRowForNameCatalog): string {
  if (credit.roleKey && !credit.isCustomRole) {
    return (
      CREW_ROLE_BY_KEY.get(credit.roleKey)?.role.label ??
      credit.role?.trim() ??
      credit.roleKey
    )
  }
  return credit.role?.trim() || 'Additional credit'
}

/** Format role labels for duplicate-merge UI copy. */
export function formatCatalogRoles(roles: string[] | undefined, max = 6): string {
  if (!roles?.length) return ''
  const unique = [...new Set(roles.map((role) => role.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  )
  if (!unique.length) return ''
  if (unique.length <= max) return unique.join(', ')
  return `${unique.slice(0, max - 1).join(', ')}, +${unique.length - (max - 1)} more`
}

function mergeCatalogRoleSets(...roleSets: Array<string[] | undefined>): string[] | undefined {
  const merged = new Set<string>()
  for (const roles of roleSets) {
    for (const role of roles ?? []) {
      const trimmed = role.trim()
      if (trimmed) merged.add(trimmed)
    }
  }
  return merged.size ? [...merged].sort((a, b) => a.localeCompare(b)) : undefined
}

/** Merge catalog entries that share the same display name. */
export function mergeNameCatalogs(...catalogs: NameCatalogEntry[][]): NameCatalogEntry[] {
  const byName = new Map<string, NameCatalogEntry>()

  for (const catalog of catalogs) {
    for (const entry of catalog) {
      const name = entry.name.trim()
      if (!name) continue
      const existing = byName.get(name)
      if (!existing) {
        byName.set(name, {
          ...entry,
          name,
          roles: entry.roles?.length ? [...entry.roles] : undefined,
        })
        continue
      }
      byName.set(name, {
        name,
        count: existing.count + entry.count,
        url: existing.url ?? entry.url,
        linkTitle: existing.linkTitle ?? entry.linkTitle,
        identityId: existing.identityId ?? entry.identityId,
        roles: mergeCatalogRoleSets(existing.roles, entry.roles),
      })
    }
  }

  return [...byName.values()]
}

/** Build a name catalog from crew credit rows, including role labels per person. */
export function buildNameCatalogFromCredits(
  credits: CreditRowForNameCatalog[],
): NameCatalogEntry[] {
  const occurrences: Array<{
    name?: string
    url?: string
    linkTitle?: string
    identityId?: string
    roleLabel: string
  }> = []

  for (const credit of credits) {
    const roleLabel = resolveCreditRoleLabel(credit)
    for (const person of credit.people ?? []) {
      const identityId = person.identityId || person.identity?._ref
      occurrences.push({
        ...person,
        ...(identityId ? {identityId} : {}),
        roleLabel,
      })
    }
  }

  const byName = new Map<
    string,
    {
      name: string
      count: number
      urlCounts: Map<string, number>
      linkTitles: Map<string, number>
      roles: Set<string>
      identityId?: string
    }
  >()

  for (const person of occurrences) {
    const name = person.name?.trim()
    if (!name) continue
    const existing = byName.get(name)
    if (!existing) {
      const urlCounts = new Map<string, number>()
      const linkTitles = new Map<string, number>()
      if (person.url?.trim()) urlCounts.set(person.url.trim(), 1)
      if (person.linkTitle?.trim()) linkTitles.set(person.linkTitle.trim(), 1)
      byName.set(name, {
        name,
        count: 1,
        urlCounts,
        linkTitles,
        roles: new Set([person.roleLabel]),
        ...(person.identityId ? {identityId: person.identityId} : {}),
      })
      continue
    }
    existing.count++
    existing.roles.add(person.roleLabel)
    if (!existing.identityId && person.identityId) {
      existing.identityId = person.identityId
    }
    if (person.url?.trim()) {
      const url = person.url.trim()
      existing.urlCounts.set(url, (existing.urlCounts.get(url) ?? 0) + 1)
    }
    if (person.linkTitle?.trim()) {
      const title = person.linkTitle.trim()
      existing.linkTitles.set(title, (existing.linkTitles.get(title) ?? 0) + 1)
    }
  }

  return [...byName.values()].map((entry) => {
    const bestUrl = [...entry.urlCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const bestTitle = [...entry.linkTitles.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const roles = [...entry.roles].sort((a, b) => a.localeCompare(b))
    return {
      name: entry.name,
      count: entry.count,
      roles,
      ...(bestUrl ? {url: bestUrl} : {}),
      ...(bestTitle ? {linkTitle: bestTitle} : {}),
      ...(entry.identityId ? {identityId: entry.identityId} : {}),
    }
  })
}

/** Aggregate people into a catalog keyed by exact display name. */
export function buildNameCatalog(
  people: Array<{name?: string; url?: string; linkTitle?: string}>,
): NameCatalogEntry[] {
  const byName = new Map<
    string,
    {name: string; count: number; urlCounts: Map<string, number>; linkTitles: Map<string, number>}
  >()

  for (const person of people) {
    const name = person.name?.trim()
    if (!name) continue
    const existing = byName.get(name)
    if (!existing) {
      const urlCounts = new Map<string, number>()
      const linkTitles = new Map<string, number>()
      if (person.url?.trim()) urlCounts.set(person.url.trim(), 1)
      if (person.linkTitle?.trim()) linkTitles.set(person.linkTitle.trim(), 1)
      byName.set(name, {name, count: 1, urlCounts, linkTitles})
      continue
    }
    existing.count++
    if (person.url?.trim()) {
      const url = person.url.trim()
      existing.urlCounts.set(url, (existing.urlCounts.get(url) ?? 0) + 1)
    }
    if (person.linkTitle?.trim()) {
      const title = person.linkTitle.trim()
      existing.linkTitles.set(title, (existing.linkTitles.get(title) ?? 0) + 1)
    }
  }

  return [...byName.values()].map((entry) => {
    const bestUrl = [...entry.urlCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const bestTitle = [...entry.linkTitles.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    return {
      name: entry.name,
      count: entry.count,
      ...(bestUrl ? {url: bestUrl} : {}),
      ...(bestTitle ? {linkTitle: bestTitle} : {}),
    }
  })
}

export function formatMatchReasons(reasons: MatchReason[]): string {
  return reasons
    .map((reason) => {
      switch (reason) {
        case 'diacritic':
          return 'diacritic'
        case 'word_order':
          return 'word order'
        case 'hyphen_spacing':
          return 'hyphen/spacing'
        case 'shared_url':
          return 'shared URL'
        case 'nickname_prefix':
          return 'nickname prefix'
        case 'nickname_suffix':
          return 'nickname suffix'
        default:
          return reason
      }
    })
    .join(' · ')
}
