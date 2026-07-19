/**
 * Soft-delete / restore / permanent-delete lifecycle for Content tool documents.
 *
 * Works on portfolioEntry, blogPost, and page. Uses marker-based trash plus
 * trashRecord audit docs (string IDs only — never strong refs).
 */

import type {SanityClient} from '@sanity/client'

export const TRASHABLE_TYPES = ['portfolioEntry', 'blogPost', 'page'] as const
export type TrashableType = (typeof TRASHABLE_TYPES)[number]

export const TRASH_RETENTION_DAYS = 30

export type RemovedReferenceBackup = {
  referrerId: string
  referrerPublishedId: string
  referrerType: string
  referrerTitle: string
  path: string
  kind: 'arrayItem' | 'arrayReference' | 'referenceField'
  itemKey?: string
  valueJson: string
}

export type InboundReferenceImpact = {
  referrerPublishedId: string
  referrerType: string
  referrerTitle: string
  path: string
  kind: RemovedReferenceBackup['kind']
  count: number
}

export type DocumentInventory = {
  publishedId: string
  documentType: TrashableType
  title: string
  variantIds: string[]
  published?: {_id: string; _rev: string; trash?: {trashedAt?: string}}
  draft?: {_id: string; _rev: string; trash?: {trashedAt?: string}}
  versions: Array<{
    _id: string
    _rev: string
    releaseId: string
    trash?: {trashedAt?: string}
  }>
  schedules: Array<{releaseId: string; publishAt?: string; state?: string}>
  isTrashed: boolean
}

export type TrashPreflightItem = {
  inventory: DocumentInventory
  impacts: InboundReferenceImpact[]
}

export type LifecycleResult = {
  publishedId: string
  title: string
  ok: boolean
  error?: string
  restoredReferences?: number
  restoredReferenceConflicts?: string[]
  rescheduled?: boolean
}

function publishedIdOf(id: string): string {
  if (id.startsWith('drafts.')) return id.slice('drafts.'.length)
  if (id.startsWith('versions.')) {
    const parts = id.split('.')
    return parts.slice(2).join('.')
  }
  return id
}

function releaseIdOfVersion(id: string): string | null {
  if (!id.startsWith('versions.')) return null
  const parts = id.split('.')
  return parts[1] || null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isReferenceTo(
  value: unknown,
  targetPublishedId: string,
): value is {_ref: string; _type?: string; _key?: string} {
  if (!isRecord(value) || typeof value._ref !== 'string') return false
  return publishedIdOf(value._ref) === targetPublishedId
}

function titleOf(doc: Record<string, unknown> | undefined): string {
  if (!doc) return 'Untitled'
  if (typeof doc.title === 'string' && doc.title.trim()) return doc.title
  if (typeof doc.name === 'string' && doc.name.trim()) return doc.name
  return 'Untitled'
}

export function trashRecordId(publishedId: string): string {
  return `trashRecord.${publishedId}`
}

export function purgeAfterFrom(trashedAt: Date = new Date()): string {
  const d = new Date(trashedAt)
  d.setDate(d.getDate() + TRASH_RETENTION_DAYS)
  return d.toISOString()
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForReleaseState(
  client: SanityClient,
  releaseId: string,
  desired: string[],
  attempts = 12,
): Promise<string | undefined> {
  for (let i = 0; i < attempts; i++) {
    const release = await client.releases.get({releaseId})
    const state = (release as {state?: string} | null)?.state
    if (state && desired.includes(state)) return state
    await wait(400)
  }
  const release = await client.releases.get({releaseId})
  return (release as {state?: string} | null)?.state
}

type InventoryDoc = {
  _id: string
  _type: string
  _rev: string
  title?: string
  name?: string
  trash?: {trashedAt?: string}
}

type ReleaseHit = {
  releaseId: string
  state?: string
  publishAt?: string
  intendedPublishAt?: string
  cardinality?: string
  documents: InventoryDoc[]
}

/**
 * Scheduled/locked version docs are sometimes invisible to sanity::versionOf
 * while still returned by sanity::partOfRelease (what the table uses). Merge both.
 */
async function fetchReleaseVersions(
  client: SanityClient,
  publishedId: string,
): Promise<ReleaseHit[]> {
  try {
    // Exact same filter as DocumentTable — scanning all releases can fail/timeout.
    const hits = await client.fetch<ReleaseHit[]>(
      `releases::all()[metadata.cardinality == "one" && state == "scheduled"]{
        "releaseId": string::split(_id, ".")[2],
        state,
        publishAt,
        "intendedPublishAt": metadata.intendedPublishAt,
        "cardinality": metadata.cardinality,
        "documents": *[
          sanity::partOfRelease(string::split(^._id, ".")[2])
        ]{_id, _type, _rev, title, name, trash}
      }`,
    )
    return (hits || [])
      .map((hit) => ({
        ...hit,
        documents: (hit.documents || []).filter(
          (doc) => doc?._id && publishedIdOf(String(doc._id)) === publishedId,
        ),
      }))
      .filter((hit) => hit.documents.length > 0)
  } catch {
    return []
  }
}

export type DeleteHint = {
  releaseId?: string
  versionId?: string
  title?: string
}

function inventoryFromHint(
  publishedId: string,
  hint?: DeleteHint,
): DocumentInventory | null {
  if (!hint?.releaseId && !hint?.versionId) return null
  const releaseId =
    hint.releaseId ||
    (hint.versionId ? releaseIdOfVersion(hint.versionId) : null)
  if (!releaseId) return null
  const versionId = hint.versionId || `versions.${releaseId}.${publishedId}`
  return {
    publishedId,
    documentType: 'portfolioEntry',
    title: hint.title || publishedId,
    variantIds: [versionId],
    versions: [
      {
        _id: versionId,
        _rev: '',
        releaseId,
      },
    ],
    schedules: [{releaseId, state: 'scheduled'}],
    isTrashed: false,
  }
}

export async function inventoryDocument(
  client: SanityClient,
  publishedId: string,
): Promise<DocumentInventory> {
  // sanity::versionOf returns published + drafts.* + versions.* variants when
  // visible. Also scan releases — scheduled/locked versions can be missing from
  // versionOf while still appearing in the Content table.
  const [typed, releaseHits] = await Promise.all([
    client.fetch<InventoryDoc[]>(
      `*[sanity::versionOf($publishedId)]{_id, _type, _rev, title, name, trash}`,
      {publishedId},
    ),
    fetchReleaseVersions(client, publishedId),
  ])

  const byId = new Map<string, InventoryDoc>()
  for (const doc of typed) byId.set(doc._id, doc)
  for (const hit of releaseHits) {
    for (const doc of hit.documents || []) {
      if (doc?._id) byId.set(doc._id, doc)
    }
  }

  let published: DocumentInventory['published']
  let draft: DocumentInventory['draft']
  const versions: DocumentInventory['versions'] = []
  let documentType: TrashableType = 'portfolioEntry'
  let title = 'Untitled'

  for (const doc of byId.values()) {
    title = titleOf(doc)
    if (TRASHABLE_TYPES.includes(doc._type as TrashableType)) {
      documentType = doc._type as TrashableType
    }
    if (doc._id === publishedId) {
      published = {_id: doc._id, _rev: doc._rev, trash: doc.trash}
    } else if (doc._id === `drafts.${publishedId}`) {
      draft = {_id: doc._id, _rev: doc._rev, trash: doc.trash}
    } else if (doc._id.startsWith('versions.')) {
      const releaseId = releaseIdOfVersion(doc._id)
      if (releaseId) {
        versions.push({
          _id: doc._id,
          _rev: doc._rev,
          releaseId,
          trash: doc.trash,
        })
      }
    }
  }

  // If releases referenced this id but returned no document bodies (true ghost),
  // still record the release ids so dispose/unschedule can clear them.
  const schedules: DocumentInventory['schedules'] = []
  const releaseIds = new Set<string>([
    ...versions.map((v) => v.releaseId),
    ...releaseHits.map((h) => h.releaseId).filter(Boolean),
  ])

  for (const releaseId of releaseIds) {
    const fromHit = releaseHits.find((h) => h.releaseId === releaseId)
    try {
      const release = await client.releases.get({releaseId})
      const meta = (release as {metadata?: {cardinality?: string; intendedPublishAt?: string}} | null)
        ?.metadata
      const state = (release as {state?: string} | null)?.state || fromHit?.state
      const publishAt =
        (release as {publishAt?: string} | null)?.publishAt ||
        meta?.intendedPublishAt ||
        fromHit?.publishAt ||
        fromHit?.intendedPublishAt
      if (meta?.cardinality === 'one' || fromHit?.cardinality === 'one' || state === 'scheduled') {
        schedules.push({releaseId, publishAt, state})
      }
    } catch {
      if (fromHit && (fromHit.cardinality === 'one' || fromHit.state === 'scheduled')) {
        schedules.push({
          releaseId,
          publishAt: fromHit.publishAt || fromHit.intendedPublishAt,
          state: fromHit.state,
        })
      }
    }
  }

  const isTrashed = Boolean(
    published?.trash?.trashedAt ||
      draft?.trash?.trashedAt ||
      versions.some((v) => v.trash?.trashedAt),
  )

  return {
    publishedId,
    documentType,
    title,
    variantIds: [
      ...(published ? [published._id] : []),
      ...(draft ? [draft._id] : []),
      ...versions.map((v) => v._id),
    ],
    published,
    draft,
    versions,
    schedules,
    isTrashed,
  }
}

async function forceUnschedule(
  client: SanityClient,
  releaseId: string,
): Promise<string | undefined> {
  let state = (await client.releases.get({releaseId}) as {state?: string} | null)?.state
  if (state === 'scheduled' || state === 'scheduling') {
    await client.releases.unschedule({releaseId})
    state = await waitForReleaseState(client, releaseId, ['active', 'archived'], 20)
  }
  // Wait out transitional unscheduling if needed.
  if (state === 'unscheduling') {
    state = await waitForReleaseState(client, releaseId, ['active', 'archived'], 20)
  }
  return state
}

async function discardVariant(
  client: SanityClient,
  versionId: string,
): Promise<void> {
  try {
    await client.action({
      actionType: 'sanity.action.document.version.discard',
      versionId,
      purge: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/not found|already|does not exist/i.test(message)) throw error
  }
}

function walkForReferences(
  value: unknown,
  path: Array<string | number>,
  targetPublishedId: string,
  referrer: {
    _id: string
    _type: string
    title: string
  },
  out: RemovedReferenceBackup[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (isReferenceTo(item, targetPublishedId)) {
        out.push({
          referrerId: referrer._id,
          referrerPublishedId: publishedIdOf(referrer._id),
          referrerType: referrer._type,
          referrerTitle: referrer.title,
          path: path.join('.'),
          kind: 'arrayReference',
          itemKey: typeof item._key === 'string' ? item._key : undefined,
          valueJson: JSON.stringify(item),
        })
        return
      }
      if (isRecord(item) && isReferenceTo(item.portfolioRef, targetPublishedId)) {
        out.push({
          referrerId: referrer._id,
          referrerPublishedId: publishedIdOf(referrer._id),
          referrerType: referrer._type,
          referrerTitle: referrer.title,
          path: path.join('.'),
          kind: 'arrayItem',
          itemKey: typeof item._key === 'string' ? item._key : String(index),
          valueJson: JSON.stringify(item),
        })
        return
      }
      walkForReferences(item, [...path, index], targetPublishedId, referrer, out)
    })
    return
  }

  if (!isRecord(value)) return

  if (isReferenceTo(value, targetPublishedId) && path.length > 0) {
    // Direct reference field handled by parent array/object walk; skip root.
  }

  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith('_')) continue
    if (isReferenceTo(child, targetPublishedId)) {
      out.push({
        referrerId: referrer._id,
        referrerPublishedId: publishedIdOf(referrer._id),
        referrerType: referrer._type,
        referrerTitle: referrer.title,
        path: [...path, key].join('.'),
        kind: 'referenceField',
        valueJson: JSON.stringify(child),
      })
      continue
    }
    walkForReferences(child, [...path, key], targetPublishedId, referrer, out)
  }
}

export async function findInboundReferences(
  client: SanityClient,
  targetPublishedId: string,
): Promise<RemovedReferenceBackup[]> {
  const referrers = await client.fetch<
    Array<{_id: string; _type: string; title?: string; name?: string}>
  >(
    `*[references($id) && !(_id in [$id, $draftId]) && !(_id match $versionPattern) && _type != "trashRecord"]{
      _id, _type, title, name
    }`,
    {
      id: targetPublishedId,
      draftId: `drafts.${targetPublishedId}`,
      versionPattern: `versions.*.${targetPublishedId}`,
    },
  )

  const backups: RemovedReferenceBackup[] = []

  for (const ref of referrers) {
    // Prefer drafting the draft variant when present so restore lands on editable copy.
    const draftId = `drafts.${publishedIdOf(ref._id)}`
    const publishedRefId = publishedIdOf(ref._id)
    const draftDoc = await client.getDocument(draftId)
    const publishedDoc = await client.getDocument(publishedRefId)
    const targets = [draftDoc, publishedDoc].filter(Boolean) as Array<
      Record<string, unknown> & {_id: string; _type: string}
    >

    // Deduplicate by id
    const seen = new Set<string>()
    for (const doc of targets) {
      if (seen.has(doc._id)) continue
      seen.add(doc._id)
      walkForReferences(
        doc,
        [],
        targetPublishedId,
        {
          _id: doc._id,
          _type: doc._type,
          title: titleOf(doc),
        },
        backups,
      )
    }
  }

  return backups
}

export function summarizeImpacts(
  backups: RemovedReferenceBackup[],
): InboundReferenceImpact[] {
  const map = new Map<string, InboundReferenceImpact>()
  for (const b of backups) {
    const key = `${b.referrerPublishedId}:${b.path}:${b.kind}`
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
    } else {
      map.set(key, {
        referrerPublishedId: b.referrerPublishedId,
        referrerType: b.referrerType,
        referrerTitle: b.referrerTitle,
        path: b.path,
        kind: b.kind,
        count: 1,
      })
    }
  }
  return [...map.values()].sort((a, b) =>
    a.referrerTitle.localeCompare(b.referrerTitle),
  )
}

function stripReferencesFromDoc(
  doc: Record<string, unknown>,
  targetPublishedId: string,
): Record<string, unknown> {
  const clone = structuredClone(doc)

  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      const next: unknown[] = []
      for (const item of value) {
        if (isReferenceTo(item, targetPublishedId)) continue
        if (isRecord(item) && isReferenceTo(item.portfolioRef, targetPublishedId)) {
          // Remove whole hero-slide (or similar) placement.
          continue
        }
        next.push(walk(item))
      }
      return next
    }
    if (!isRecord(value)) return value
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      if (isReferenceTo(child, targetPublishedId)) continue
      out[key] = walk(child)
    }
    return out
  }

  return walk(clone) as Record<string, unknown>
}

async function unscheduleCardinalityOneReleases(
  client: SanityClient,
  inventory: DocumentInventory,
): Promise<{releaseId: string; publishAt?: string} | null> {
  let prior: {releaseId: string; publishAt?: string} | null = null
  for (const schedule of inventory.schedules) {
    if (
      schedule.state === 'scheduled' ||
      schedule.state === 'scheduling' ||
      schedule.state === 'unscheduling'
    ) {
      prior = {releaseId: schedule.releaseId, publishAt: schedule.publishAt}
      await forceUnschedule(client, schedule.releaseId)
    }
  }
  return prior
}

export async function preflightTrash(
  client: SanityClient,
  publishedIds: string[],
): Promise<TrashPreflightItem[]> {
  const items: TrashPreflightItem[] = []
  for (const publishedId of publishedIds) {
    const inventory = await inventoryDocument(client, publishedId)
    if (inventory.variantIds.length === 0 && inventory.schedules.length === 0) {
      throw new Error(`Document not found: ${publishedId}`)
    }
    if (!TRASHABLE_TYPES.includes(inventory.documentType)) {
      throw new Error(`Type ${inventory.documentType} cannot be trashed`)
    }
    const backups = await findInboundReferences(client, publishedId)
    items.push({inventory, impacts: summarizeImpacts(backups)})
  }
  return items
}

export async function moveToTrash(
  client: SanityClient,
  publishedIds: string[],
  actorLabel: string,
): Promise<LifecycleResult[]> {
  const batchId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `batch-${Date.now()}`
  const trashedAt = new Date()
  const purgeAfter = purgeAfterFrom(trashedAt)
  const results: LifecycleResult[] = []

  for (const publishedId of publishedIds) {
    try {
      const inventory = await inventoryDocument(client, publishedId)
      if (inventory.variantIds.length === 0) {
        // Orphan scheduled release whose version body is not queryable via
        // versionOf — still clear it so table ghosts can be removed.
        if (inventory.schedules.length > 0) {
          await disposeReleaseVersions(client, inventory)
          try {
            await client.delete(trashRecordId(publishedId))
          } catch {
            // ignore
          }
          results.push({publishedId, title: inventory.title, ok: true})
          continue
        }
        results.push({
          publishedId,
          title: publishedId,
          ok: false,
          error: 'Document not found',
        })
        continue
      }
      if (inventory.isTrashed) {
        results.push({
          publishedId,
          title: inventory.title,
          ok: true,
        })
        continue
      }

      const priorSchedule = await unscheduleCardinalityOneReleases(client, inventory)
      const backups = await findInboundReferences(client, publishedId)

      // Remove inbound references on each affected referrer document.
      const referrerIds = [...new Set(backups.map((b) => b.referrerId))]
      for (const referrerId of referrerIds) {
        const doc = await client.getDocument(referrerId)
        if (!doc) continue
        const cleaned = stripReferencesFromDoc(
          doc as Record<string, unknown>,
          publishedId,
        )
        // Keep identity fields; replace content via createOrReplace.
        await client.createOrReplace({
          ...(cleaned as {_id: string; _type: string}),
        })
      }

      const trash = {
        trashedAt: trashedAt.toISOString(),
        trashedBy: actorLabel,
        purgeAfter,
        batchId,
      }

      const tx = client.transaction()
      for (const variantId of inventory.variantIds) {
        // Refresh after unscheduling — version ids remain.
        tx.patch(variantId, (p) => p.set({trash}))
      }
      tx.createOrReplace({
        _id: trashRecordId(publishedId),
        _type: 'trashRecord',
        targetId: publishedId,
        targetType: inventory.documentType,
        title: inventory.title,
        trashedAt: trashedAt.toISOString(),
        trashedBy: actorLabel,
        purgeAfter,
        batchId,
        schedule: priorSchedule || undefined,
        removedReferences: backups,
      })
      await tx.commit({visibility: 'sync'})

      results.push({publishedId, title: inventory.title, ok: true})
    } catch (error) {
      results.push({
        publishedId,
        title: publishedId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

function restoreReferenceIntoDoc(
  doc: Record<string, unknown>,
  backup: RemovedReferenceBackup,
): {doc: Record<string, unknown>; ok: boolean; conflict?: string} {
  const clone = structuredClone(doc)
  let value: unknown
  try {
    value = JSON.parse(backup.valueJson)
  } catch {
    return {doc: clone, ok: false, conflict: `Invalid backup JSON at ${backup.path}`}
  }

  const segments = backup.path.split('.').filter(Boolean)
  if (segments.length === 0) {
    return {doc: clone, ok: false, conflict: 'Empty restore path'}
  }

  // Navigate to parent container.
  let cursor: unknown = clone
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    if (!isRecord(cursor) && !Array.isArray(cursor)) {
      return {
        doc: clone,
        ok: false,
        conflict: `Missing path ${backup.path} on ${backup.referrerId}`,
      }
    }
    if (Array.isArray(cursor)) {
      const idx = Number(seg)
      if (!Number.isFinite(idx) || !cursor[idx]) {
        return {
          doc: clone,
          ok: false,
          conflict: `Array index missing for ${backup.path}`,
        }
      }
      cursor = cursor[idx]
    } else {
      if (!(seg in cursor)) {
        return {
          doc: clone,
          ok: false,
          conflict: `Field missing for ${backup.path}`,
        }
      }
      cursor = cursor[seg]
    }
  }

  const leaf = segments[segments.length - 1]

  if (backup.kind === 'arrayItem' || backup.kind === 'arrayReference') {
    if (!Array.isArray(cursor)) {
      // leaf is the array field name on parent object
      if (!isRecord(cursor)) {
        return {doc: clone, ok: false, conflict: `Expected array at ${backup.path}`}
      }
      const arr = cursor[leaf]
      if (!Array.isArray(arr)) {
        return {doc: clone, ok: false, conflict: `Expected array at ${backup.path}`}
      }
      const exists = arr.some((item) => {
        if (backup.kind === 'arrayReference') {
          return isRecord(item) && item._ref === (value as {_ref?: string})._ref
        }
        return (
          isRecord(item) &&
          isRecord(value) &&
          typeof value._key === 'string' &&
          item._key === value._key
        )
      })
      if (exists) return {doc: clone, ok: true}
      arr.push(value)
      return {doc: clone, ok: true}
    }
  }

  if (backup.kind === 'referenceField') {
    if (!isRecord(cursor)) {
      return {doc: clone, ok: false, conflict: `Expected object at ${backup.path}`}
    }
    if (cursor[leaf] != null) {
      return {
        doc: clone,
        ok: false,
        conflict: `Field ${backup.path} already has a value on ${backup.referrerTitle}`,
      }
    }
    cursor[leaf] = value
    return {doc: clone, ok: true}
  }

  return {doc: clone, ok: false, conflict: `Unsupported restore kind ${backup.kind}`}
}

export async function restoreFromTrash(
  client: SanityClient,
  publishedIds: string[],
): Promise<LifecycleResult[]> {
  const results: LifecycleResult[] = []

  for (const publishedId of publishedIds) {
    try {
      const inventory = await inventoryDocument(client, publishedId)
      if (inventory.variantIds.length === 0) {
        results.push({
          publishedId,
          title: publishedId,
          ok: false,
          error: 'Document not found',
        })
        continue
      }

      const record = await client.getDocument(trashRecordId(publishedId))
      const removedReferences = (record?.removedReferences ||
        []) as RemovedReferenceBackup[]
      const schedule = record?.schedule as
        | {releaseId?: string; publishAt?: string}
        | undefined

      let restoredReferences = 0
      const conflicts: string[] = []

      // Group backups by referrer document id.
      const byReferrer = new Map<string, RemovedReferenceBackup[]>()
      for (const backup of removedReferences) {
        const list = byReferrer.get(backup.referrerId) || []
        list.push(backup)
        byReferrer.set(backup.referrerId, list)
      }

      for (const [referrerId, backups] of byReferrer) {
        const doc = await client.getDocument(referrerId)
        if (!doc) {
          conflicts.push(`Referrer ${referrerId} no longer exists`)
          continue
        }
        let next = doc as Record<string, unknown>
        for (const backup of backups) {
          const result = restoreReferenceIntoDoc(next, backup)
          next = result.doc
          if (result.ok) restoredReferences += 1
          else if (result.conflict) conflicts.push(result.conflict)
        }
        await client.createOrReplace(next as {_id: string; _type: string})
      }

      const tx = client.transaction()
      for (const variantId of inventory.variantIds) {
        tx.patch(variantId, (p) => p.unset(['trash']))
      }
      tx.delete(trashRecordId(publishedId))
      await tx.commit({visibility: 'sync'})

      let rescheduled = false
      if (schedule?.publishAt) {
        const when = new Date(schedule.publishAt)
        if (when.getTime() > Date.now()) {
          // Try the original release first; it may have been destroyed by a
          // failed permanent delete, in which case recreate the schedule from
          // scratch using the stored publish time.
          if (schedule.releaseId) {
            try {
              await client.releases.schedule({
                releaseId: schedule.releaseId,
                publishAt: when.toISOString(),
              })
              rescheduled = true
            } catch {
              // Fall through to recreation below.
            }
          }
          if (!rescheduled) {
            try {
              const baseId = inventory.draft?._id ?? inventory.published?._id
              if (!baseId) throw new Error('No draft or published version to schedule')
              const release = await client.releases.create({
                metadata: {
                  title: `Scheduled: ${inventory.title}`,
                  releaseType: 'scheduled',
                  cardinality: 'one',
                  intendedPublishAt: when.toISOString(),
                },
              })
              await client.createVersion({
                publishedId,
                baseId,
                releaseId: release.releaseId,
              })
              await client.releases.schedule({
                releaseId: release.releaseId,
                publishAt: when.toISOString(),
              })
              rescheduled = true
            } catch (err) {
              conflicts.push(
                `Could not restore schedule (${when.toLocaleString()}): ${
                  err instanceof Error ? err.message : String(err)
                }`,
              )
            }
          }
        } else {
          conflicts.push(
            `Previous schedule time (${when.toLocaleString()}) has passed — left unscheduled`,
          )
        }
      }

      results.push({
        publishedId,
        title: inventory.title,
        ok: true,
        restoredReferences,
        restoredReferenceConflicts: conflicts,
        rescheduled,
      })
    } catch (error) {
      results.push({
        publishedId,
        title: publishedId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

async function disposeReleaseVersions(
  client: SanityClient,
  inventory: DocumentInventory,
): Promise<void> {
  const releaseIds = [
    ...new Set([
      ...inventory.schedules.map((s) => s.releaseId),
      ...inventory.versions.map((v) => v.releaseId),
    ]),
  ]

  for (const releaseId of releaseIds) {
    try {
      const state = await forceUnschedule(client, releaseId)
      const release = await client.releases.get({releaseId})
      const cardinality = (release as {metadata?: {cardinality?: string}} | null)?.metadata
        ?.cardinality

      if (cardinality === 'one') {
        // Prefer discarding the version explicitly first. Archiving a
        // cardinality-one release deletes versions, but if archive is skipped
        // (wrong state / race), a scheduled version can resurrect in the table.
        const version = inventory.versions.find((v) => v.releaseId === releaseId)
        if (version) {
          await discardVariant(client, version._id)
        } else {
          try {
            await client.discardVersion({
              publishedId: inventory.publishedId,
              releaseId,
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            if (!/not found|already|does not exist/i.test(message)) throw error
          }
        }

        const current =
          state === 'active' || state === 'archived'
            ? state
            : await waitForReleaseState(client, releaseId, ['active', 'archived'], 20)

        if (current === 'active') {
          await client.releases.archive({releaseId})
          await waitForReleaseState(client, releaseId, ['archived'], 20)
        }
        try {
          await client.releases.delete({releaseId})
        } catch {
          // Delete only works for archived/published releases; versions are
          // already discarded above either way.
        }
      } else {
        // Multi-doc release: never archive the whole release — discard this version only.
        const latest = (await client.releases.get({releaseId}) as {state?: string} | null)?.state
        if (latest === 'scheduled' || latest === 'scheduling') {
          throw new Error(
            `Document is part of multi-document scheduled release ${releaseId}`,
          )
        }
        const version = inventory.versions.find((v) => v.releaseId === releaseId)
        if (version) {
          await discardVariant(client, version._id)
        } else {
          await client.discardVersion({
            publishedId: inventory.publishedId,
            releaseId,
          })
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/not found|already|does not exist/i.test(message)) throw error
    }
  }
}

export async function permanentlyDelete(
  client: SanityClient,
  publishedIds: string[],
  hints: Record<string, DeleteHint> = {},
): Promise<LifecycleResult[]> {
  const results: LifecycleResult[] = []

  for (const publishedId of publishedIds) {
    try {
      let inventory = await inventoryDocument(client, publishedId)
      const hint = hints[publishedId]

      // Seed from UI-known release/version when inventory can't see locked docs.
      if (
        inventory.variantIds.length === 0 &&
        inventory.schedules.length === 0 &&
        hint
      ) {
        const seeded = inventoryFromHint(publishedId, hint)
        if (seeded) inventory = seeded
      } else if (hint?.releaseId || hint?.versionId) {
        // Merge hint into inventory so dispose always has the release id.
        const seeded = inventoryFromHint(publishedId, {
          ...hint,
          title: inventory.title || hint.title,
        })
        if (seeded) {
          const releaseIds = new Set(inventory.schedules.map((s) => s.releaseId))
          for (const schedule of seeded.schedules) {
            if (!releaseIds.has(schedule.releaseId)) {
              inventory.schedules.push(schedule)
            }
          }
          const versionIds = new Set(inventory.versions.map((v) => v._id))
          for (const version of seeded.versions) {
            if (!versionIds.has(version._id)) {
              inventory.versions.push(version)
              inventory.variantIds.push(version._id)
            }
          }
          if (hint.title && inventory.title === 'Untitled') {
            inventory = {...inventory, title: hint.title}
          }
        }
      }

      if (inventory.variantIds.length === 0) {
        // Still dispose orphan scheduled releases, then drop trash record.
        if (inventory.schedules.length > 0) {
          await disposeReleaseVersions(client, inventory)
        }
        try {
          await client.delete(trashRecordId(publishedId))
        } catch {
          // ignore
        }
        results.push({publishedId, title: inventory.title || publishedId, ok: true})
        continue
      }

      await disposeReleaseVersions(client, inventory)

      // Refresh inventory after release disposal — discard whatever remains.
      const fresh = await inventoryDocument(client, publishedId)

      // Always discard leftover release versions first (covers the case where
      // archive did not remove them and only a draft discard used to run).
      for (const version of fresh.versions) {
        try {
          await forceUnschedule(client, version.releaseId)
        } catch {
          // continue — discard may still succeed on an active release
        }
        await discardVariant(client, version._id)
      }

      const includeDrafts = [
        ...(fresh.draft ? [fresh.draft._id] : []),
        // Re-read in case dispose left ids that discardVariant already cleared;
        // the delete action tolerates missing drafts via error handling below.
        ...fresh.versions.map((v) => v._id),
      ]

      // purge:false — purging history requires the "editHistory" permission,
      // which Studio browser sessions lack even for admins. The documents are
      // fully deleted either way; history simply expires per plan retention.
      if (fresh.published) {
        try {
          await client.action({
            actionType: 'sanity.action.document.delete',
            publishedId,
            includeDrafts,
            purge: false,
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          if (!/not found|already|does not exist/i.test(message)) throw error
        }
      } else if (fresh.draft) {
        await discardVariant(client, fresh.draft._id)
      }

      // Final sweep — catch any variant that raced back into existence.
      const leftover = await inventoryDocument(client, publishedId)
      for (const version of leftover.versions) {
        try {
          await forceUnschedule(client, version.releaseId)
        } catch {
          // ignore
        }
        await discardVariant(client, version._id)
      }
      if (leftover.draft) {
        await discardVariant(client, leftover.draft._id)
      }
      if (leftover.published) {
        // Draft was already discarded above when present; don't re-list it.
        await client.action({
          actionType: 'sanity.action.document.delete',
          publishedId,
          includeDrafts: [],
          purge: false,
        })
      }

      try {
        await client.delete(trashRecordId(publishedId))
      } catch {
        // ignore missing trash record
      }

      results.push({publishedId, title: inventory.title, ok: true})
    } catch (error) {
      results.push({
        publishedId,
        title: publishedId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

export async function purgeExpiredTrash(
  client: SanityClient,
  now: Date = new Date(),
): Promise<LifecycleResult[]> {
  const expired = await client.fetch<Array<{targetId: string; title?: string}>>(
    `*[_type == "trashRecord" && purgeAfter <= $now]{targetId, title}`,
    {now: now.toISOString()},
  )
  return permanentlyDelete(
    client,
    expired.map((row) => row.targetId),
  )
}

export function formatImpactSummary(impacts: InboundReferenceImpact[]): string {
  if (impacts.length === 0) return ''
  const byDoc = new Map<string, InboundReferenceImpact[]>()
  for (const impact of impacts) {
    const list = byDoc.get(impact.referrerPublishedId) || []
    list.push(impact)
    byDoc.set(impact.referrerPublishedId, list)
  }
  return [...byDoc.values()]
    .map((list) => {
      const title = list[0].referrerTitle || list[0].referrerPublishedId
      const type = list[0].referrerType
      const paths = list.map((i) => i.path).join(', ')
      return `• ${title} (${type}) — ${paths}`
    })
    .join('\n')
}
