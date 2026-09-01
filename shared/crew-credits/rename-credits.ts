/**
 * Rename crewPerson.name slots site-wide or within a credits array.
 *
 * Used by Studio link-memory rename propagation and creditIdentity merge repoint.
 */

import type {CrewCreditValue} from './types'
import {normalizeCreditToken} from './normalize'

export interface PropagatePersonRenameInput {
  fromName: string
  toName: string
  /** When set, rename by identity ref (preferred) and patch the identity document name. */
  identityId?: string
}

/** Normalize a credit name for rename / link-memory lookup. */
export function normalizePersonName(name: string): string {
  return normalizeCreditToken(name)
}

/**
 * Rename every person slot that matches fromName (normalized) or identityId.
 * Preserves url and linkTitle on renamed slots.
 */
export function applyPersonRenameToCredits(
  credits: CrewCreditValue[] | undefined,
  rename: PropagatePersonRenameInput,
): {credits: CrewCreditValue[]; peopleUpdated: number} {
  const fromName = rename.fromName.trim()
  const toName = rename.toName.trim()
  const identityId = rename.identityId?.trim()
  const fromKey = normalizePersonName(fromName)
  if (!toName || !credits?.length) {
    return {credits: credits ?? [], peopleUpdated: 0}
  }
  if (!identityId && (!fromKey || fromName === toName)) {
    return {credits: credits ?? [], peopleUpdated: 0}
  }
  if (identityId && fromName === toName) {
    return {credits: credits ?? [], peopleUpdated: 0}
  }

  let peopleUpdated = 0
  const next = credits.map((credit) => {
    const people = (credit.people ?? []).map((person) => {
      const matchesIdentity =
        Boolean(identityId) && person.identity?._ref === identityId
      const matchesName =
        !identityId && Boolean(fromKey) && normalizePersonName(person.name ?? '') === fromKey
      if (!matchesIdentity && !matchesName) return person
      if (person.name === toName) return person
      peopleUpdated += 1
      return {...person, name: toName}
    })
    return {...credit, people}
  })

  return {credits: next, peopleUpdated}
}

export type StaleCrewPersonNameSlot = {
  documentId: string
  personKey?: string
  department?: string
  roleKey?: string
  fromName: string
}

export type SyncCrewPersonNamesResult = {
  canonicalId: string
  canonicalName: string
  staleSlots: StaleCrewPersonNameSlot[]
  documentsUpdated: number
  peopleUpdated: number
}

export type SyncCrewPersonNamesClient = {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>
  patch: (id: string) => {
    set: (fields: Record<string, unknown>) => {commit: () => Promise<unknown>}
  }
}

const SYNC_PORTFOLIOS_QUERY = `
  *[_type == "portfolioEntry" && references($canonicalId)]{
    _id,
    "slug": slug.current,
    crewCredits[]{
      _key,
      department,
      roleKey,
      role,
      isCustomRole,
      people[]{_key, name, url, linkTitle, identity}
    }
  }
`

/** Collect slots where identity ref matches but person.name !== canonicalName. */
export function findStaleCrewPersonNamesForIdentity(
  portfolios: Array<{
    _id: string
    crewCredits?: CrewCreditValue[]
  }>,
  canonicalId: string,
  canonicalName: string,
): StaleCrewPersonNameSlot[] {
  const stale: StaleCrewPersonNameSlot[] = []
  const targetName = canonicalName.trim()

  for (const doc of portfolios) {
    for (const credit of doc.crewCredits ?? []) {
      for (const person of credit.people ?? []) {
        if (person.identity?._ref !== canonicalId) continue
        const currentName = person.name?.trim() ?? ''
        if (!currentName || currentName === targetName) continue
        stale.push({
          documentId: doc._id,
          personKey: person._key,
          department: credit.department,
          roleKey: credit.roleKey,
          fromName: currentName,
        })
      }
    }
  }

  return stale
}

/**
 * Patch crewPerson.name on every slot referencing canonicalId where name !== canonicalName.
 * Dry-run unless `{apply: true}`.
 */
export async function syncCrewPersonNamesToIdentity(
  client: SyncCrewPersonNamesClient,
  canonicalId: string,
  canonicalName: string,
  options: {apply?: boolean} = {},
): Promise<SyncCrewPersonNamesResult> {
  const apply = options.apply === true
  const portfolios = await client.fetch<
    Array<{_id: string; slug?: string; crewCredits?: CrewCreditValue[]}>
  >(SYNC_PORTFOLIOS_QUERY, {canonicalId})

  const staleSlots = findStaleCrewPersonNamesForIdentity(
    portfolios ?? [],
    canonicalId,
    canonicalName,
  )

  if (!apply) {
    return {
      canonicalId,
      canonicalName,
      staleSlots,
      documentsUpdated: 0,
      peopleUpdated: 0,
    }
  }

  let documentsUpdated = 0
  let peopleUpdated = 0

  for (const doc of portfolios ?? []) {
    const result = applyPersonRenameToCredits(doc.crewCredits, {
      fromName: '',
      toName: canonicalName,
      identityId: canonicalId,
    })
    if (!result.peopleUpdated) continue
    await client.patch(doc._id).set({crewCredits: result.credits}).commit()
    documentsUpdated += 1
    peopleUpdated += result.peopleUpdated
  }

  return {
    canonicalId,
    canonicalName,
    staleSlots,
    documentsUpdated,
    peopleUpdated,
  }
}
