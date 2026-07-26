/**
 * Prepare CSV preview people: fill URLs from link memory, then attach
 * name-duplicate alerts for near-matches.
 */

import {
  findExactNameInCatalog,
  type NameCatalogEntry,
} from '@crew-credits'

import type {PreviewPerson} from './csv-map'
import {
  enrichPeopleWithLinkMemory,
  normalizePersonName,
  type KnownPersonLink,
} from './link-memory'
import {
  attachNameDuplicates,
  collapseSameNamePeopleInField,
} from './name-duplicates'

export function preparePreviewPeople(
  people: PreviewPerson[],
  catalog: NameCatalogEntry[],
  linkMemory: Map<string, KnownPersonLink>,
): PreviewPerson[] {
  // Exact identical spellings in one field (e.g. "Paul, Paul") → one pill.
  const collapsedExact = collapseSameNamePeopleInField(people)

  const asCrew = collapsedExact.map((person) => ({
    _type: 'crewPerson' as const,
    name: person.name,
    ...(person.url ? {url: person.url} : {}),
    ...(person.linkTitle ? {linkTitle: person.linkTitle} : {}),
  }))

  const {people: enriched} = enrichPeopleWithLinkMemory(asCrew, linkMemory)

  const withUrls: PreviewPerson[] = enriched.map((person, index) => {
    const prior = collapsedExact[index]
    const exact = findExactNameInCatalog(person.name, catalog)
    const url = person.url?.trim() || exact?.url?.trim()
    const linkTitle = person.linkTitle?.trim() || exact?.linkTitle?.trim()
    return {
      name: person.name,
      ...(url ? {url} : {}),
      ...(linkTitle ? {linkTitle} : {}),
      ...(prior?.duplicate ? {duplicate: prior.duplicate} : {}),
    }
  })

  return attachNameDuplicates(withUrls, catalog)
}

/** True when this spelling (or confirmed merge target) already exists site-wide. */
export function isKnownPreviewPerson(
  person: PreviewPerson,
  catalog: NameCatalogEntry[],
  linkMemory: Map<string, KnownPersonLink>,
): boolean {
  if (person.duplicate?.status === 'confirmed') return true
  if (findExactNameInCatalog(person.name, catalog)) return true
  return linkMemory.has(normalizePersonName(person.name))
}
