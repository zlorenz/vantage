/**
 * Normalization helpers for CSV headers, departments, and role labels.
 */

import {
  CREW_DEPARTMENTS,
  CREW_DEPARTMENT_BY_KEY,
  CREW_ROLE_BY_KEY,
  CREW_ROLES_FLAT,
  type ResolvedCrewRole,
} from './catalog'
import type {CrewDepartmentKey} from './types'

/** Collapse case, whitespace, and punctuation for fuzzy matching. */
export function normalizeCreditToken(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

const DEPARTMENT_ALIAS_TO_KEY = new Map<string, CrewDepartmentKey>()

for (const dept of CREW_DEPARTMENTS) {
  DEPARTMENT_ALIAS_TO_KEY.set(normalizeCreditToken(dept.key), dept.key)
  DEPARTMENT_ALIAS_TO_KEY.set(normalizeCreditToken(dept.label), dept.key)
}

for (const [alias, key] of [
  ['g and e', 'ge'],
  ['grip and electric', 'ge'],
  ['grip electric', 'ge'],
  ['lighting', 'ge'],
  ['post production', 'post'],
  ['still', 'stills'],
  ['still photography', 'stills'],
  ['photography', 'stills'],
] as const) {
  DEPARTMENT_ALIAS_TO_KEY.set(normalizeCreditToken(alias), key)
}

const ROLE_LOOKUP = new Map<string, ResolvedCrewRole>()

for (const entry of CREW_ROLES_FLAT) {
  const keys = [
    entry.role.key,
    entry.role.label,
    entry.role.pluralLabel,
    entry.role.legacyField,
    ...entry.role.aliases,
  ]
  for (const key of keys) {
    const normalized = normalizeCreditToken(key)
    if (!normalized) continue
    if (!ROLE_LOOKUP.has(normalized)) {
      ROLE_LOOKUP.set(normalized, entry)
    }
  }
}

/**
 * Aliases that resolve differently by department.
 * "sound engineer" → Sound Design & Mix (post) or Sound Recordist (production).
 * Default without department: post (majority of live data).
 */
const DEPT_SCOPED_ROLE_ALIASES = new Map<
  string,
  {byDepartment: Partial<Record<CrewDepartmentKey, string>>; defaultRoleKey: string}
>([
  [
    normalizeCreditToken('sound engineer'),
    {
      byDepartment: {
        production: 'sound_recordist',
        post: 'sound_design_mix',
      },
      defaultRoleKey: 'sound_design_mix',
    },
  ],
])

/** Custom role label variants → canonical custom label (not catalog standards). */
const CUSTOM_ROLE_CANONICAL = new Map<string, string>([
  [normalizeCreditToken('boom operator'), 'Boom Op'],
  [normalizeCreditToken('boom op'), 'Boom Op'],
  [normalizeCreditToken('boom'), 'Boom Op'],
  [normalizeCreditToken('medic on-set'), 'Medic'],
  [normalizeCreditToken('medic on set'), 'Medic'],
  [normalizeCreditToken('medic onset'), 'Medic'],
  [normalizeCreditToken("director's assistant"), "Director's Assistant"],
  [normalizeCreditToken('directors assistant'), "Director's Assistant"],
  [normalizeCreditToken('director assistant'), "Director's Assistant"],
])

export const CSV_HEADER_ALIASES = {
  department: ['department', 'dept', 'section'],
  role: ['role', 'position', 'title', 'credit', 'job'],
  names: ['names', 'name', 'credit name', 'credits', 'people', 'person'],
  url: ['url', 'urls', 'link', 'links', 'name url', 'name urls', 'website'],
} as const

export type CsvColumnKind = keyof typeof CSV_HEADER_ALIASES

export function matchCsvHeader(header: string): CsvColumnKind | null {
  const normalized = normalizeCreditToken(header)
  for (const [kind, aliases] of Object.entries(CSV_HEADER_ALIASES) as [
    CsvColumnKind,
    readonly string[],
  ][]) {
    if (aliases.some((alias) => normalizeCreditToken(alias) === normalized)) {
      return kind
    }
  }
  return null
}

export function resolveDepartment(raw: string | undefined | null): CrewDepartmentKey | null {
  if (!raw?.trim()) return null
  const normalized = normalizeCreditToken(raw)
  return DEPARTMENT_ALIAS_TO_KEY.get(normalized) ?? null
}

export interface ResolveStandardRoleOptions {
  /** When set, dept-scoped aliases (e.g. Sound Engineer) pick the matching catalog role. */
  department?: CrewDepartmentKey | null
}

export function resolveStandardRole(
  raw: string | undefined | null,
  options?: ResolveStandardRoleOptions,
): ResolvedCrewRole | null {
  if (!raw?.trim()) return null
  const normalized = normalizeCreditToken(raw)

  const scoped = DEPT_SCOPED_ROLE_ALIASES.get(normalized)
  if (scoped) {
    const dept = options?.department ?? null
    const roleKey =
      (dept ? scoped.byDepartment[dept] : undefined) ?? scoped.defaultRoleKey
    return CREW_ROLE_BY_KEY.get(roleKey) ?? null
  }

  return ROLE_LOOKUP.get(normalized) ?? null
}

/**
 * Canonicalize a custom role label (Boom Op, Medic, Director's Assistant).
 * Returns null when the label is already canonical or not a known custom variant.
 */
export function resolveCustomRoleCanonical(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null
  const normalized = normalizeCreditToken(raw)
  const canonical = CUSTOM_ROLE_CANONICAL.get(normalized)
  if (!canonical) return null
  if (raw.trim() === canonical) return null
  return canonical
}

export function isKnownDepartmentKey(value: string): value is CrewDepartmentKey {
  return value in CREW_DEPARTMENT_BY_KEY
}

/** Split a comma-separated names cell into trimmed person names. */
export function splitCreditNames(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

/** Split an optional URL cell that aligns 1:1 with comma-separated names. */
export function splitCreditUrls(raw: string | undefined | null, expectedCount: number): string[] {
  if (!raw?.trim()) return Array.from({length: expectedCount}, () => '')
  const parts = raw.split(',').map((part) => part.trim())
  if (parts.length === 1 && expectedCount > 1) {
    // Single URL applied to the first person only.
    return [parts[0], ...Array.from({length: expectedCount - 1}, () => '')]
  }
  while (parts.length < expectedCount) parts.push('')
  return parts.slice(0, expectedCount)
}

export function peopleIdentityKey(name: string, url?: string): string {
  return `${normalizeCreditToken(name)}|${normalizeCreditToken(url ?? '')}`
}

export function creditIdentityKey(opts: {
  department: CrewDepartmentKey
  roleKey?: string
  role: string
  isCustomRole?: boolean
}): string {
  if (opts.isCustomRole || !opts.roleKey) {
    return `custom:${opts.department}:${normalizeCreditToken(opts.role)}`
  }
  return `standard:${opts.department}:${opts.roleKey}`
}
