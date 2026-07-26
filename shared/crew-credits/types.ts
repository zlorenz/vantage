/**
 * Shared crew-credit types used by Sanity Studio, Next.js frontend, and migration.
 */

export type CrewDepartmentKey =
  | 'production'
  | 'camera'
  | 'ge'
  | 'art'
  | 'casting'
  | 'stills'
  | 'post'

export interface CrewPersonValue {
  _key?: string
  _type?: 'crewPerson'
  /** Stable vendor identity — set for Work Library filter roles. */
  identity?: {_type?: 'reference'; _ref: string; _weak?: boolean}
  name: string
  url?: string
  /** Optional anchor title (tooltip) when different from the visible name. */
  linkTitle?: string
}

/** roleKeys that get permanent creditIdentity links + Work Library filters. */
export const FILTER_CREDIT_ROLE_KEYS = [
  'brand',
  'director',
  'dop',
  'art_director',
  'editor',
] as const

export type FilterCreditRoleKey = (typeof FILTER_CREDIT_ROLE_KEYS)[number]

export function isFilterCreditRoleKey(value: string | undefined): value is FilterCreditRoleKey {
  return Boolean(value && (FILTER_CREDIT_ROLE_KEYS as readonly string[]).includes(value))
}

export interface CrewCreditValue {
  _key?: string
  _type?: 'crewCredit'
  department: CrewDepartmentKey
  roleKey?: string
  role: string
  isCustomRole?: boolean
  people: CrewPersonValue[]
}

export interface CrewRoleDefinition {
  /** Stable identifier — never use the display label as the permanent ID. */
  key: string
  /** Singular display label. */
  label: string
  /** Plural display label when more than one person is credited. */
  pluralLabel: string
  /** Legacy Sanity/ACF field slug (e.g. prod_brand). */
  legacyField: string
  /** Case-insensitive aliases accepted by the CSV mapper. */
  aliases: string[]
}

export interface CrewDepartmentDefinition {
  key: CrewDepartmentKey
  label: string
  /** Legacy ACF additional-credits repeater key. */
  legacyRepeater: string
  roles: CrewRoleDefinition[]
}
