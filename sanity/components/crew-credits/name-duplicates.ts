/**
 * Attach / resolve site-wide name-duplicate alerts on CSV preview people.
 */

import {
  buildNameCatalog,
  findNameMatch,
  formatCatalogRoles,
  type MatchReason,
  type NameCatalogEntry,
} from '@crew-credits'

import type {PreviewPerson} from './csv-map'

export type DuplicateStatus = 'pending' | 'confirmed' | 'skipped'

export interface PersonDuplicateAlert {
  candidate: string
  reasons: MatchReason[]
  confidence: 'high' | 'medium'
  count: number
  roles?: string[]
  url?: string
  linkTitle?: string
  status: DuplicateStatus
  /** Spelling as it appeared in the CSV / before confirm. */
  originalName: string
}

function duplicateFromMatch(
  match: NonNullable<ReturnType<typeof findNameMatch>>,
  status: DuplicateStatus,
  originalName: string,
): PersonDuplicateAlert {
  return {
    candidate: match.canonical,
    reasons: match.reasons,
    confidence: match.confidence,
    count: match.count,
    ...(match.roles?.length ? {roles: match.roles} : {}),
    ...(match.url ? {url: match.url} : {}),
    ...(match.linkTitle ? {linkTitle: match.linkTitle} : {}),
    status,
    originalName,
  }
}

export function catalogFromPeople(
  people: Array<{name?: string; url?: string; linkTitle?: string}>,
): NameCatalogEntry[] {
  return buildNameCatalog(people)
}

export function attachNameDuplicates(
  people: PreviewPerson[],
  catalog: NameCatalogEntry[],
): PreviewPerson[] {
  if (!catalog.length) {
    return people.map((person) => {
      const {duplicate: _omit, ...rest} = person
      return rest
    })
  }

  return people.map((person) => {
    const prior = person.duplicate
    const match = findNameMatch(person.name, catalog)

    if (!match) {
      const {duplicate: _omit, ...rest} = person
      return rest
    }

    if (
      prior?.status === 'skipped' &&
      prior.originalName === person.name &&
      prior.candidate === match.canonical
    ) {
      return {
        ...person,
        duplicate: duplicateFromMatch(match, 'skipped', prior.originalName),
      }
    }

    if (prior?.status === 'confirmed' && person.name === match.canonical) {
      return {
        ...person,
        duplicate: duplicateFromMatch(match, 'confirmed', prior.originalName),
      }
    }

    return {
      ...person,
      duplicate: duplicateFromMatch(match, 'pending', person.name),
    }
  })
}

export function confirmNameDuplicate(person: PreviewPerson): PreviewPerson {
  const alert = person.duplicate
  if (!alert) return person

  return {
    name: alert.candidate,
    ...(person.url?.trim() || alert.url ? {url: person.url?.trim() || alert.url} : {}),
    ...(person.linkTitle?.trim() || alert.linkTitle
      ? {linkTitle: person.linkTitle?.trim() || alert.linkTitle}
      : {}),
    duplicate: {
      ...alert,
      status: 'confirmed',
      originalName: alert.originalName || person.name,
    },
  }
}

export function skipNameDuplicate(person: PreviewPerson): PreviewPerson {
  const alert = person.duplicate
  if (!alert) return person
  return {
    ...person,
    duplicate: {
      ...alert,
      status: 'skipped',
      originalName: alert.originalName || person.name,
    },
  }
}

export function countPendingDuplicates(
  peopleOrRows: Array<{people?: PreviewPerson[]} | PreviewPerson>,
): number {
  let count = 0
  for (const item of peopleOrRows) {
    if ('people' in item && Array.isArray(item.people)) {
      for (const person of item.people) {
        if (person.duplicate?.status === 'pending') count++
      }
    } else if ('duplicate' in item && item.duplicate?.status === 'pending') {
      count++
    }
  }
  return count
}

export function duplicateAlertLabel(alert: PersonDuplicateAlert): string {
  const uses = `${alert.count} use${alert.count === 1 ? '' : 's'}`
  const roles = formatCatalogRoles(alert.roles)
  const detail = roles ? roles : 'existing credit'
  return `“${alert.originalName}” may be “${alert.candidate}” (${uses} · ${detail})`
}
