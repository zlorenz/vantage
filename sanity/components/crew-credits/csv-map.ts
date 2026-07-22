/**
 * Map parsed CSV rows into structured crew credits with preview metadata.
 */

import {
  CREW_DEPARTMENT_BY_KEY,
  creditIdentityKey,
  getDepartmentLabel,
  peopleIdentityKey,
  resolveDepartment,
  resolveStandardRole,
  parseLegacyNamesHtml,
  splitCreditNames,
  splitCreditUrls,
  type CrewCreditValue,
  type CrewDepartmentKey,
  type CrewPersonValue,
} from '@crew-credits'

import type {ParsedCsvRow} from './csv-parse'
import {newArrayKey} from './keys'
import type {PersonDuplicateAlert} from './name-duplicates'

export type PreviewRowStatus =
  | 'mapped'
  | 'custom'
  | 'skipped_empty'
  | 'invalid'
  | 'warning'

export interface PreviewPerson {
  name: string
  url?: string
  linkTitle?: string
  duplicate?: PersonDuplicateAlert
}

export interface MappedPreviewRow {
  id: string
  lineNumbers: number[]
  department: CrewDepartmentKey | ''
  departmentRaw: string
  roleRaw: string
  roleKey?: string
  roleLabel: string
  isCustomRole: boolean
  people: PreviewPerson[]
  status: PreviewRowStatus
  error?: string
  warning?: string
  /** Existing people already on this credit identity in the document. */
  existingPeople: PreviewPerson[]
}

export interface MapCrewCreditsResult {
  previewRows: MappedPreviewRow[]
  blockingErrorCount: number
  mappedCount: number
  customCount: number
  warningCount: number
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function namesCellContainsHtml(namesRaw: string): boolean {
  return /<a\b/i.test(namesRaw)
}

function peopleFromNamesAndUrls(namesRaw: string, urlsRaw: string): {
  people: PreviewPerson[]
  error?: string
} {
  if (!namesRaw.trim()) {
    return {people: [], error: 'Names cell is empty'}
  }

  if (namesCellContainsHtml(namesRaw)) {
    const people = parseLegacyNamesHtml(namesRaw).map((person) => ({
      name: person.name,
      ...(person.url ? {url: person.url} : {}),
      ...(person.linkTitle ? {linkTitle: person.linkTitle} : {}),
    }))
    if (!people.length) {
      return {people: [], error: 'No names found in HTML Names cell'}
    }
    return {people}
  }

  const names = splitCreditNames(namesRaw)
  if (!names.length) {
    return {people: [], error: 'Names cell is empty'}
  }

  const urls = splitCreditUrls(urlsRaw, names.length)
  const people: PreviewPerson[] = []

  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    const url = urls[i]?.trim() ?? ''
    if (url && !isHttpUrl(url)) {
      return {
        people: [],
        error: `Invalid URL for "${name}": ${url} (http/https only)`,
      }
    }
    people.push(url ? {name, url} : {name})
  }

  return {people}
}

function existingPeopleForIdentity(
  existing: CrewCreditValue[] | undefined,
  identity: string,
): PreviewPerson[] {
  if (!existing?.length) return []
  for (const credit of existing) {
    const key = creditIdentityKey({
      department: credit.department,
      roleKey: credit.roleKey,
      role: credit.role,
      isCustomRole: credit.isCustomRole,
    })
    if (key !== identity) continue
    return (credit.people ?? []).map((person) => ({
      name: person.name,
      url: person.url,
      linkTitle: person.linkTitle,
    }))
  }
  return []
}

/**
 * Aggregate parsed CSV rows into preview rows.
 * Repeated standard/custom roles are combined; blank names already filtered upstream.
 */
export function mapCrewCreditsCsvRows(
  rows: ParsedCsvRow[],
  existingCredits: CrewCreditValue[] = [],
): MapCrewCreditsResult {
  const byIdentity = new Map<string, MappedPreviewRow>()
  const invalid: MappedPreviewRow[] = []

  for (const row of rows) {
    const {people, error: peopleError} = peopleFromNamesAndUrls(row.names, row.url)
    if (peopleError || !people.length) {
      invalid.push({
        id: `invalid-${row.lineNumber}`,
        lineNumbers: [row.lineNumber],
        department: '',
        departmentRaw: row.department,
        roleRaw: row.role,
        roleLabel: row.role,
        isCustomRole: true,
        people: [],
        status: 'invalid',
        error: peopleError ?? 'No names found',
        existingPeople: [],
      })
      continue
    }

    if (!row.role.trim()) {
      invalid.push({
        id: `invalid-${row.lineNumber}`,
        lineNumbers: [row.lineNumber],
        department: resolveDepartment(row.department) ?? '',
        departmentRaw: row.department,
        roleRaw: row.role,
        roleLabel: row.role,
        isCustomRole: true,
        people,
        status: 'invalid',
        error: 'Role is required',
        existingPeople: [],
      })
      continue
    }

    const standard = resolveStandardRole(row.role)
    const deptFromCsv = resolveDepartment(row.department)

    if (standard) {
      const department = standard.departmentKey
      let warning: string | undefined
      if (deptFromCsv && deptFromCsv !== department) {
        warning = `Department mismatch: CSV says "${row.department}" but "${standard.role.label}" belongs to ${getDepartmentLabel(department)}`
      } else if (row.department.trim() && !deptFromCsv) {
        warning = `Unrecognized department "${row.department}" — using catalog department ${getDepartmentLabel(department)}`
      }

      const identity = creditIdentityKey({
        department,
        roleKey: standard.role.key,
        role: standard.role.label,
        isCustomRole: false,
      })

      const existing = byIdentity.get(identity)
      if (existing) {
        existing.lineNumbers.push(row.lineNumber)
        existing.people = mergePeople(existing.people, people)
        if (warning && !existing.warning) existing.warning = warning
        if (warning) existing.status = existing.status === 'invalid' ? 'invalid' : 'warning'
        continue
      }

      byIdentity.set(identity, {
        id: identity,
        lineNumbers: [row.lineNumber],
        department,
        departmentRaw: row.department,
        roleRaw: row.role,
        roleKey: standard.role.key,
        roleLabel: standard.role.label,
        isCustomRole: false,
        people: [...people],
        status: warning ? 'warning' : 'mapped',
        warning,
        existingPeople: existingPeopleForIdentity(existingCredits, identity),
      })
      continue
    }

    // Custom / unrecognized role
    if (!deptFromCsv) {
      invalid.push({
        id: `invalid-${row.lineNumber}`,
        lineNumbers: [row.lineNumber],
        department: '',
        departmentRaw: row.department,
        roleRaw: row.role,
        roleLabel: row.role,
        isCustomRole: true,
        people,
        status: 'invalid',
        error: row.department.trim()
          ? `Unknown role "${row.role}" and unrecognized department "${row.department}"`
          : `Unknown role "${row.role}" requires a valid Department column`,
        existingPeople: [],
      })
      continue
    }

    const identity = creditIdentityKey({
      department: deptFromCsv,
      role: row.role.trim(),
      isCustomRole: true,
    })

    const existing = byIdentity.get(identity)
    if (existing) {
      existing.lineNumbers.push(row.lineNumber)
      existing.people = mergePeople(existing.people, people)
      continue
    }

    byIdentity.set(identity, {
      id: identity,
      lineNumbers: [row.lineNumber],
      department: deptFromCsv,
      departmentRaw: row.department,
      roleRaw: row.role,
      roleLabel: row.role.trim(),
      isCustomRole: true,
      people: [...people],
      status: 'custom',
      existingPeople: existingPeopleForIdentity(existingCredits, identity),
    })
  }

  const previewRows = [...byIdentity.values(), ...invalid].sort((a, b) => {
    const aLine = a.lineNumbers[0] ?? 0
    const bLine = b.lineNumbers[0] ?? 0
    return aLine - bLine
  })

  return {
    previewRows,
    blockingErrorCount: previewRows.filter((row) => row.status === 'invalid').length,
    mappedCount: previewRows.filter((row) => row.status === 'mapped' || row.status === 'warning').length,
    customCount: previewRows.filter((row) => row.status === 'custom').length,
    warningCount: previewRows.filter((row) => row.status === 'warning' || row.warning).length,
  }
}

function mergePeople(existing: PreviewPerson[], incoming: PreviewPerson[]): PreviewPerson[] {
  const seen = new Set(existing.map((person) => peopleIdentityKey(person.name, person.url)))
  const next = [...existing]
  for (const person of incoming) {
    const key = peopleIdentityKey(person.name, person.url)
    if (seen.has(key)) continue
    seen.add(key)
    next.push(person)
  }
  return next
}

/** Convert an editable preview row into a Sanity crewCredit value. */
export function previewRowToCrewCredit(row: MappedPreviewRow): CrewCreditValue | null {
  if (row.status === 'invalid') return null
  if (!row.department || !row.roleLabel.trim() || !row.people.length) return null

  const people: CrewPersonValue[] = row.people
    .filter((person) => person.name.trim())
    .map((person) => ({
      _type: 'crewPerson',
      _key: newArrayKey(),
      name: person.name.trim(),
      ...(person.url?.trim() ? {url: person.url.trim()} : {}),
      ...(person.linkTitle?.trim() ? {linkTitle: person.linkTitle.trim()} : {}),
    }))

  if (!people.length) return null

  if (row.isCustomRole || !row.roleKey) {
    return {
      _type: 'crewCredit',
      _key: newArrayKey(),
      department: row.department,
      role: row.roleLabel.trim(),
      isCustomRole: true,
      people,
    }
  }

  const catalogRole = CREW_DEPARTMENT_BY_KEY[row.department]?.roles.find((r) => r.key === row.roleKey)

  return {
    _type: 'crewCredit',
    _key: newArrayKey(),
    department: row.department,
    roleKey: row.roleKey,
    role: catalogRole?.label ?? row.roleLabel.trim(),
    isCustomRole: false,
    people,
  }
}

export function buildRejectedRowsCsv(rows: MappedPreviewRow[]): string {
  const lines = ['Line,Department,Role,Names,Error']
  for (const row of rows.filter((r) => r.status === 'invalid')) {
    const names = row.people.map((p) => p.name).join(', ')
    const cells = [
      row.lineNumbers.join(';'),
      row.departmentRaw || row.department,
      row.roleRaw || row.roleLabel,
      names || '',
      row.error ?? 'Invalid row',
    ].map((value) => {
      const text = String(value)
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    })
    lines.push(cells.join(','))
  }
  return `\uFEFF${lines.join('\n')}\n`
}
