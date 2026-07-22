/**
 * Merge / replace imported crew credits into the current draft array.
 */

import {
  CREW_ROLE_BY_KEY,
  creditIdentityKey,
  type CrewCreditValue,
  type CrewDepartmentKey,
  type CrewPersonValue,
} from '@crew-credits'

import type {MappedPreviewRow} from './csv-map'
import {previewRowToCrewCredit} from './csv-map'
import {newArrayKey} from './keys'
import {
  enrichPeopleWithLinkMemory,
  type KnownPersonLink,
} from './link-memory'

export type CrewCreditsImportMode = 'fill' | 'replace'

export interface MergeCrewCreditsResult {
  credits: CrewCreditValue[]
  added: number
  updated: number
  skippedPreserved: number
  peopleAppended: number
  linksEnriched: number
}

function clonePeople(people: CrewPersonValue[] | undefined): CrewPersonValue[] {
  return (people ?? []).map((person) => ({
    _type: 'crewPerson',
    _key: person._key || newArrayKey(),
    name: person.name,
    ...(person.url ? {url: person.url} : {}),
    ...(person.linkTitle ? {linkTitle: person.linkTitle} : {}),
  }))
}

function mergePeopleLists(
  existing: CrewPersonValue[],
  incoming: CrewPersonValue[],
): {people: CrewPersonValue[]; appended: number} {
  // Match primarily by name so enriching a URL does not create duplicates.
  const byName = new Map(
    existing.map((person) => [normalizeName(person.name), person] as const),
  )
  const next = [...existing]
  let appended = 0

  for (const person of incoming) {
    const nameKey = normalizeName(person.name)
    const prior = byName.get(nameKey)
    if (prior) {
      // Prefer existing URL; fill from incoming if missing.
      if (!prior.url && person.url) {
        const index = next.indexOf(prior)
        const updated = {
          ...prior,
          url: person.url,
          ...(person.linkTitle && !prior.linkTitle ? {linkTitle: person.linkTitle} : {}),
        }
        next[index] = updated
        byName.set(nameKey, updated)
      }
      continue
    }

    const added = {
      _type: 'crewPerson' as const,
      _key: person._key || newArrayKey(),
      name: person.name,
      ...(person.url ? {url: person.url} : {}),
      ...(person.linkTitle ? {linkTitle: person.linkTitle} : {}),
    }
    next.push(added)
    byName.set(nameKey, added)
    appended++
  }
  return {people: next, appended}
}

function normalizeName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function sortCrewCredits(credits: CrewCreditValue[]): CrewCreditValue[] {
  return sortCredits(credits)
}

function sortCredits(credits: CrewCreditValue[]): CrewCreditValue[] {
  return [...credits].sort((a, b) => {
    const aMeta = a.roleKey ? CREW_ROLE_BY_KEY.get(a.roleKey) : undefined
    const bMeta = b.roleKey ? CREW_ROLE_BY_KEY.get(b.roleKey) : undefined
    const aDept = a.department
    const bDept = b.department
    const deptOrder = (key: CrewDepartmentKey) =>
      ['production', 'camera', 'ge', 'art', 'casting', 'stills', 'post'].indexOf(key)

    const deptDiff = deptOrder(aDept) - deptOrder(bDept)
    if (deptDiff !== 0) return deptDiff

    const aCustom = a.isCustomRole || !a.roleKey
    const bCustom = b.isCustomRole || !b.roleKey
    if (aCustom !== bCustom) return aCustom ? 1 : -1

    const aSort = aMeta?.sortIndex ?? Number.MAX_SAFE_INTEGER
    const bSort = bMeta?.sortIndex ?? Number.MAX_SAFE_INTEGER
    if (aSort !== bSort) return aSort - bSort

    return a.role.localeCompare(b.role, undefined, {sensitivity: 'base'})
  })
}

/**
 * Apply preview rows onto existing crewCredits.
 *
 * fill (default): preserve populated standard roles; append nonduplicate custom people.
 * replace: replace values only for identities present in the CSV; leave others untouched.
 *
 * Optional linkMemory fills missing person URLs from known names (document + site-wide).
 */
export function mergeCrewCredits(
  existing: CrewCreditValue[] | undefined,
  previewRows: MappedPreviewRow[],
  mode: CrewCreditsImportMode = 'fill',
  linkMemory?: Map<string, KnownPersonLink>,
): MergeCrewCreditsResult {
  const current: CrewCreditValue[] = (existing ?? []).map((credit) => ({
    ...credit,
    _type: 'crewCredit' as const,
    _key: credit._key || newArrayKey(),
    people: clonePeople(credit.people),
  }))

  const byIdentity = new Map<string, number>()
  current.forEach((credit, index) => {
    byIdentity.set(
      creditIdentityKey({
        department: credit.department,
        roleKey: credit.roleKey,
        role: credit.role,
        isCustomRole: credit.isCustomRole,
      }),
      index,
    )
  })

  let added = 0
  let updated = 0
  let skippedPreserved = 0
  let peopleAppended = 0
  let linksEnriched = 0

  const applicable = previewRows.filter((row) => row.status !== 'invalid')

  for (const row of applicable) {
    let incoming = previewRowToCrewCredit(row)
    if (!incoming) continue

    if (linkMemory?.size) {
      const enriched = enrichPeopleWithLinkMemory(incoming.people, linkMemory)
      incoming = {...incoming, people: enriched.people}
      linksEnriched += enriched.enriched
    }

    const identity = creditIdentityKey({
      department: incoming.department,
      roleKey: incoming.roleKey,
      role: incoming.role,
      isCustomRole: incoming.isCustomRole,
    })

    const existingIndex = byIdentity.get(identity)

    if (existingIndex === undefined) {
      current.push({
        ...incoming,
        _type: 'crewCredit',
        _key: incoming._key || newArrayKey(),
      })
      byIdentity.set(identity, current.length - 1)
      added++
      continue
    }

    const existingCredit = current[existingIndex]
    const hasPeople = (existingCredit.people?.length ?? 0) > 0

    if (mode === 'replace') {
      current[existingIndex] = {
        ...existingCredit,
        department: incoming.department,
        roleKey: incoming.roleKey,
        role: incoming.role,
        isCustomRole: incoming.isCustomRole,
        people: clonePeople(incoming.people),
      }
      updated++
      continue
    }

    // fill / merge
    if (!incoming.isCustomRole && hasPeople) {
      skippedPreserved++
      continue
    }

    const merged = mergePeopleLists(existingCredit.people ?? [], incoming.people)
    current[existingIndex] = {
      ...existingCredit,
      people: merged.people,
      role: existingCredit.role || incoming.role,
      roleKey: existingCredit.roleKey || incoming.roleKey,
      isCustomRole: existingCredit.isCustomRole ?? incoming.isCustomRole,
    }
    if (merged.appended > 0) {
      peopleAppended += merged.appended
      updated++
    } else if (!hasPeople && incoming.people.length) {
      updated++
    } else {
      skippedPreserved++
    }
  }

  return {
    credits: sortCredits(current),
    added,
    updated,
    skippedPreserved,
    peopleAppended,
    linksEnriched,
  }
}
