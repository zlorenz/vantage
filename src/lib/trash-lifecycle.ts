/**
 * Server-side trash purge helpers for Vercel Cron.
 *
 * Mirrors permanent-delete semantics used by the Studio Content tool.
 */

import type {SanityClient} from '@sanity/client'
import {TRASH_RETENTION_DAYS} from '@trash-retention'
import {getSanityWriteClient} from '@/lib/sanity-write-client'

export {TRASH_RETENTION_DAYS}

function releaseIdOfVersion(id: string): string | null {
  if (!id.startsWith('versions.')) return null
  return id.split('.')[1] || null
}

function trashRecordId(publishedId: string): string {
  return `trashRecord.${publishedId}`
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForReleaseState(
  client: SanityClient,
  releaseId: string,
  desired: string[],
  attempts = 20,
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

async function forceUnschedule(
  client: SanityClient,
  releaseId: string,
): Promise<string | undefined> {
  let state = (await client.releases.get({releaseId}) as {state?: string} | null)?.state
  if (state === 'scheduled' || state === 'scheduling') {
    await client.releases.unschedule({releaseId})
    state = await waitForReleaseState(client, releaseId, ['active', 'archived'])
  }
  if (state === 'unscheduling') {
    state = await waitForReleaseState(client, releaseId, ['active', 'archived'])
  }
  return state
}

async function discardVariant(client: SanityClient, versionId: string): Promise<void> {
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

/** Alias used by the purge cron — same client as getSanityWriteClient(). */
export function getTrashWriteClient(): SanityClient {
  return getSanityWriteClient()
}

type PurgeResult = {
  publishedId: string
  title: string
  ok: boolean
  error?: string
}

type VariantDoc = {
  _id: string
  _type: string
  title?: string
  name?: string
}

async function permanentlyDeleteOne(
  client: SanityClient,
  publishedId: string,
): Promise<PurgeResult> {
  const docs = await client.fetch<VariantDoc[]>(
    `*[sanity::versionOf($publishedId)]{_id, _type, title, name}`,
    {publishedId},
  )

  const title =
    docs.find((d) => typeof d.title === 'string')?.title ||
    docs.find((d) => typeof d.name === 'string')?.name ||
    publishedId

  const versions = docs.filter((d) => d._id.startsWith('versions.'))
  for (const version of versions) {
    const releaseId = releaseIdOfVersion(version._id)
    if (!releaseId) continue
    try {
      const state = await forceUnschedule(client, releaseId)
      const release = await client.releases.get({releaseId})
      const cardinality = (release as {metadata?: {cardinality?: string}} | null)
        ?.metadata?.cardinality

      await discardVariant(client, version._id)

      if (cardinality === 'one') {
        const current =
          state === 'active' || state === 'archived'
            ? state
            : await waitForReleaseState(client, releaseId, ['active', 'archived'])
        if (current === 'active') {
          await client.releases.archive({releaseId})
          await waitForReleaseState(client, releaseId, ['archived'])
        }
        try {
          await client.releases.delete({releaseId})
        } catch {
          // ignore
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/not found|already|does not exist/i.test(message)) {
        return {publishedId, title, ok: false, error: message}
      }
    }
  }

  const fresh = await client.fetch<Array<{_id: string}>>(
    `*[sanity::versionOf($publishedId)]{_id}`,
    {publishedId},
  )
  const published = fresh.find((d) => d._id === publishedId)
  const draft = fresh.find((d) => d._id === `drafts.${publishedId}`)
  const remainingVersions = fresh.filter((d) => d._id.startsWith('versions.'))

  for (const version of remainingVersions) {
    const releaseId = releaseIdOfVersion(version._id)
    if (releaseId) {
      try {
        await forceUnschedule(client, releaseId)
      } catch {
        // continue
      }
    }
    await discardVariant(client, version._id)
  }

  if (published) {
    await client.action({
      actionType: 'sanity.action.document.delete',
      publishedId,
      includeDrafts: [
        ...(draft ? [draft._id] : []),
        ...remainingVersions.map((v) => v._id),
      ],
      // purge:false — purging history needs the "editHistory" permission,
      // which most tokens lack. Deletion is complete either way.
      purge: false,
    })
  } else if (draft) {
    await discardVariant(client, draft._id)
  }

  // Final sweep for races (e.g. scheduled version surviving draft discard).
  const leftover = await client.fetch<Array<{_id: string}>>(
    `*[sanity::versionOf($publishedId)]{_id}`,
    {publishedId},
  )
  for (const doc of leftover) {
    if (doc._id === publishedId) {
      await client.action({
        actionType: 'sanity.action.document.delete',
        publishedId,
        includeDrafts: [],
        purge: false,
      })
    } else {
      if (doc._id.startsWith('versions.')) {
        const releaseId = releaseIdOfVersion(doc._id)
        if (releaseId) {
          try {
            await forceUnschedule(client, releaseId)
          } catch {
            // ignore
          }
        }
      }
      await discardVariant(client, doc._id)
    }
  }

  try {
    await client.delete(trashRecordId(publishedId))
  } catch {
    // ignore
  }

  return {publishedId, title, ok: true}
}

export async function purgeExpiredTrash(
  client: SanityClient = getTrashWriteClient(),
  now: Date = new Date(),
): Promise<PurgeResult[]> {
  const expired = await client.fetch<Array<{targetId: string; title?: string}>>(
    `*[_type == "trashRecord" && purgeAfter <= $now]{targetId, title}`,
    {now: now.toISOString()},
  )

  const results: PurgeResult[] = []
  for (const row of expired) {
    try {
      results.push(await permanentlyDeleteOne(client, row.targetId))
    } catch (error) {
      results.push({
        publishedId: row.targetId,
        title: row.title || row.targetId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return results
}
