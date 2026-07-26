/**
 * Name-based link memory for crew credits.
 *
 * CSV imports are names-only by default. When applying, people without a URL
 * inherit links from the current document and site-wide crewCredits history
 * (e.g. "Vantage Pictures", "Govee").
 */

import {normalizeCreditToken, type CrewCreditValue, type CrewPersonValue} from '@crew-credits'

export interface KnownPersonLink {
  url: string
  linkTitle?: string
}

interface LinkCandidate extends KnownPersonLink {
  count: number
}

/** Normalize a credit name for link-memory lookup. */
export function normalizePersonName(name: string): string {
  return normalizeCreditToken(name)
}

function collectPeople(
  sources: Array<CrewCreditValue[] | CrewPersonValue[] | undefined>,
): CrewPersonValue[] {
  const people: CrewPersonValue[] = []
  for (const source of sources) {
    if (!source?.length) continue
    const first = source[0] as CrewCreditValue | CrewPersonValue
    if ('people' in first || 'department' in first) {
      for (const credit of source as CrewCreditValue[]) {
        for (const person of credit.people ?? []) people.push(person)
      }
    } else {
      for (const person of source as CrewPersonValue[]) people.push(person)
    }
  }
  return people
}

/**
 * Build a name → {url, linkTitle} map from one or more credit sources.
 * When the same name appears with different URLs, the most frequent wins;
 * ties keep the first-seen URL (call with newest-first sources to prefer recent).
 */
export function buildLinkMemory(
  ...sources: Array<CrewCreditValue[] | CrewPersonValue[] | undefined>
): Map<string, KnownPersonLink> {
  const tallies = new Map<string, Map<string, LinkCandidate>>()

  for (const person of collectPeople(sources)) {
    const nameKey = normalizePersonName(person.name ?? '')
    const url = person.url?.trim()
    if (!nameKey || !url) continue

    const byUrl = tallies.get(nameKey) ?? new Map<string, LinkCandidate>()
    const existing = byUrl.get(url)
    if (existing) {
      existing.count += 1
      if (!existing.linkTitle && person.linkTitle?.trim()) {
        existing.linkTitle = person.linkTitle.trim()
      }
    } else {
      byUrl.set(url, {
        url,
        ...(person.linkTitle?.trim() ? {linkTitle: person.linkTitle.trim()} : {}),
        count: 1,
      })
    }
    tallies.set(nameKey, byUrl)
  }

  const memory = new Map<string, KnownPersonLink>()
  for (const [nameKey, byUrl] of tallies) {
    let best: LinkCandidate | undefined
    for (const candidate of byUrl.values()) {
      if (!best || candidate.count > best.count) best = candidate
    }
    if (best) {
      memory.set(nameKey, {
        url: best.url,
        ...(best.linkTitle ? {linkTitle: best.linkTitle} : {}),
      })
    }
  }
  return memory
}

/** Overlay later maps onto earlier ones (document memory should win over site-wide). */
export function mergeLinkMemories(
  ...maps: Array<Map<string, KnownPersonLink> | undefined>
): Map<string, KnownPersonLink> {
  const merged = new Map<string, KnownPersonLink>()
  for (const map of maps) {
    if (!map) continue
    for (const [key, value] of map) merged.set(key, value)
  }
  return merged
}

/**
 * Fill missing urls/linkTitles on people from link memory.
 * Never overwrites an existing URL.
 */
export function enrichPersonWithLinkMemory(
  person: CrewPersonValue,
  memory: Map<string, KnownPersonLink>,
): CrewPersonValue {
  if (person.url?.trim()) {
    return person
  }
  const known = memory.get(normalizePersonName(person.name ?? ''))
  if (!known) return person

  return {
    ...person,
    url: known.url,
    ...(known.linkTitle && !person.linkTitle?.trim()
      ? {linkTitle: known.linkTitle}
      : person.linkTitle
        ? {linkTitle: person.linkTitle}
        : {}),
  }
}

export function enrichPeopleWithLinkMemory(
  people: CrewPersonValue[] | undefined,
  memory: Map<string, KnownPersonLink>,
): {people: CrewPersonValue[]; enriched: number} {
  let enriched = 0
  const next = (people ?? []).map((person) => {
    if (person.url?.trim()) return person
    const updated = enrichPersonWithLinkMemory(person, memory)
    if (updated.url && updated.url !== person.url) enriched += 1
    return updated
  })
  return {people: next, enriched}
}

export function enrichCreditsWithLinkMemory(
  credits: CrewCreditValue[],
  memory: Map<string, KnownPersonLink>,
): {credits: CrewCreditValue[]; enriched: number} {
  let enriched = 0
  const next = credits.map((credit) => {
    const result = enrichPeopleWithLinkMemory(credit.people, memory)
    enriched += result.enriched
    return {...credit, people: result.people}
  })
  return {credits: next, enriched}
}

export interface PropagatePersonLinkInput {
  name: string
  url: string
  linkTitle?: string
  /** When set, update creditIdentity.url only (no portfolio fan-out). */
  identityId?: string
}

/**
 * Apply a person link to every matching name in a crewCredits array.
 * Matches by normalizePersonName. Overwrites existing URLs for that name.
 */
export function applyPersonLinkToCredits(
  credits: CrewCreditValue[] | undefined,
  link: PropagatePersonLinkInput,
): {credits: CrewCreditValue[]; peopleUpdated: number} {
  const nameKey = normalizePersonName(link.name)
  const url = link.url.trim()
  if (!nameKey || !url || !credits?.length) {
    return {credits: credits ?? [], peopleUpdated: 0}
  }

  let peopleUpdated = 0
  const next = credits.map((credit) => {
    const people = (credit.people ?? []).map((person) => {
      if (normalizePersonName(person.name ?? '') !== nameKey) return person

      const currentUrl = person.url?.trim() || ''
      const currentTitle = person.linkTitle?.trim() || undefined
      // Only set title when caller provides one; otherwise keep existing.
      const nextTitle = link.linkTitle?.trim() || currentTitle

      if (currentUrl === url && currentTitle === nextTitle) return person

      peopleUpdated += 1
      return {
        ...person,
        url,
        ...(nextTitle ? {linkTitle: nextTitle} : {}),
      }
    })
    return {...credit, people}
  })

  return {credits: next, peopleUpdated}
}

type SanityPatchClient = {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>
  patch: (id: string) => {
    set: (attrs: Record<string, unknown>) => {
      commit: (options?: Record<string, unknown>) => Promise<unknown>
    }
    unset: (paths: string[]) => {
      commit: (options?: Record<string, unknown>) => Promise<unknown>
    }
  }
}

function publishedAndDraftIds(documentId: string | undefined): Set<string> {
  const ids = new Set<string>()
  if (!documentId) return ids
  const published = documentId.replace(/^drafts\./, '')
  ids.add(published)
  ids.add(`drafts.${published}`)
  return ids
}

/**
 * Save a person link.
 * - With identityId: patch creditIdentity.url only (fast path).
 * - Without: fan-out by name across portfolio entries (legacy / unlinked people).
 */
export async function propagatePersonLinkAcrossPortfolio(
  client: SanityPatchClient,
  link: PropagatePersonLinkInput,
  opts?: {excludeDocumentId?: string},
): Promise<{documentsUpdated: number; peopleUpdated: number; viaIdentity: boolean}> {
  const identityId = link.identityId?.trim()
  const url = link.url.trim()

  if (identityId) {
    if (url) {
      await client
        .patch(identityId)
        .set({url})
        .commit({returnDocuments: false})
    } else {
      await client
        .patch(identityId)
        .unset(['url'])
        .commit({returnDocuments: false})
    }
    return {documentsUpdated: 1, peopleUpdated: 1, viaIdentity: true}
  }

  const nameKey = normalizePersonName(link.name)
  if (!nameKey || !url) {
    return {documentsUpdated: 0, peopleUpdated: 0, viaIdentity: false}
  }

  const docs = await client.fetch<
    {_id: string; crewCredits?: CrewCreditValue[]}[]
  >(
    `*[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
      _id,
      crewCredits[]{
        _key,
        _type,
        department,
        roleKey,
        role,
        isCustomRole,
        people[]{_key, _type, name, url, linkTitle, identity}
      }
    }`,
  )

  const skip = publishedAndDraftIds(opts?.excludeDocumentId)
  let documentsUpdated = 0
  let peopleUpdated = 0

  for (const doc of docs ?? []) {
    if (skip.has(doc._id)) continue
    const result = applyPersonLinkToCredits(doc.crewCredits, link)
    if (!result.peopleUpdated) continue
    await client.patch(doc._id).set({crewCredits: result.credits}).commit()
    documentsUpdated += 1
    peopleUpdated += result.peopleUpdated
  }

  return {documentsUpdated, peopleUpdated, viaIdentity: false}
}

export interface PropagatePersonRenameInput {
  fromName: string
  toName: string
  /** When set, rename by identity ref (preferred) and patch the identity document name. */
  identityId?: string
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

/**
 * Rename a credited person on every other portfolioEntry.
 * Prefer identityId when provided; otherwise match by normalized name.
 * Also patches the creditIdentity document name when identityId is set.
 */
export async function propagatePersonRenameAcrossPortfolio(
  client: SanityPatchClient,
  rename: PropagatePersonRenameInput,
  opts?: {excludeDocumentId?: string},
): Promise<{documentsUpdated: number; peopleUpdated: number}> {
  const fromName = rename.fromName.trim()
  const toName = rename.toName.trim()
  const identityId = rename.identityId?.trim()
  const fromKey = normalizePersonName(fromName)
  if (!toName || fromName === toName) {
    return {documentsUpdated: 0, peopleUpdated: 0}
  }
  if (!identityId && !fromKey) {
    return {documentsUpdated: 0, peopleUpdated: 0}
  }

  if (identityId) {
    await client.patch(identityId).set({name: toName}).commit({returnDocuments: false})
  }

  const docs = await client.fetch<
    {_id: string; crewCredits?: CrewCreditValue[]}[]
  >(
    `*[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
      _id,
      crewCredits[]{
        _key,
        _type,
        department,
        roleKey,
        role,
        isCustomRole,
        people[]{_key, _type, name, url, linkTitle, identity}
      }
    }`,
  )

  const skip = publishedAndDraftIds(opts?.excludeDocumentId)
  let documentsUpdated = 0
  let peopleUpdated = 0

  for (const doc of docs ?? []) {
    if (skip.has(doc._id)) continue
    const result = applyPersonRenameToCredits(doc.crewCredits, {
      fromName,
      toName,
      ...(identityId ? {identityId} : {}),
    })
    if (!result.peopleUpdated) continue
    await client.patch(doc._id).set({crewCredits: result.credits}).commit()
    documentsUpdated += 1
    peopleUpdated += result.peopleUpdated
  }

  return {documentsUpdated, peopleUpdated}
}
