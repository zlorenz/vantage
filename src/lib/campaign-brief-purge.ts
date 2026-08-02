/**
 * Campaign-brief attachment purge — deletes expired campaignBriefAttachment
 * documents and their referenced file assets (no cascade; assets must be
 * deleted explicitly after the referring doc is gone).
 */

import type {SanityClient} from '@sanity/client'
import {
  CAMPAIGN_BRIEF_RETENTION_DAYS,
  campaignBriefPurgeCutoff,
} from '@campaign-brief-retention'
import {getSanityWriteClient} from '@/lib/sanity-write-client'

export {CAMPAIGN_BRIEF_RETENTION_DAYS, campaignBriefPurgeCutoff}

export type CampaignBriefPurgeCandidate = {
  _id: string
  _createdAt: string
  companyName?: string
  campaignTitle?: string
  assetIds: string[]
  filenames: string[]
}

export type CampaignBriefPurgeResult = {
  documentId: string
  _createdAt: string
  companyName?: string
  campaignTitle?: string
  assetIds: string[]
  filenames: string[]
  ok: boolean
  dryRun: boolean
  deletedDocument?: boolean
  deletedAssets?: string[]
  error?: string
}

const EXPIRED_QUERY = `*[
  _type == "campaignBriefAttachment"
  && !(_id in path("drafts.**"))
  && _createdAt < $cutoff
] | order(_createdAt asc) {
  _id,
  _createdAt,
  companyName,
  campaignTitle,
  "assetIds": files[].file.asset._ref,
  "filenames": files[].originalFilename
}`

export async function findExpiredCampaignBriefAttachments(
  client: SanityClient = getSanityWriteClient(),
  now: Date = new Date(),
): Promise<CampaignBriefPurgeCandidate[]> {
  const cutoff = campaignBriefPurgeCutoff(now)
  const rows = await client.fetch<CampaignBriefPurgeCandidate[]>(EXPIRED_QUERY, {
    cutoff,
  })
  return rows.map((row) => ({
    ...row,
    assetIds: (row.assetIds ?? []).filter(Boolean),
    filenames: (row.filenames ?? []).filter(Boolean),
  }))
}

async function deleteAssetIfPresent(
  client: SanityClient,
  assetId: string,
): Promise<'deleted' | 'missing'> {
  try {
    await client.delete(assetId)
    return 'deleted'
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // Already gone — treat as success for idempotent retries.
    if (/not found|does not exist|404/i.test(message)) return 'missing'
    throw error
  }
}

/**
 * Delete one campaignBriefAttachment and its file assets.
 * Order matters: remove the document first so strong refs no longer block
 * asset deletion (Sanity does not cascade).
 */
async function purgeOne(
  client: SanityClient,
  candidate: CampaignBriefPurgeCandidate,
  dryRun: boolean,
): Promise<CampaignBriefPurgeResult> {
  const base: CampaignBriefPurgeResult = {
    documentId: candidate._id,
    _createdAt: candidate._createdAt,
    companyName: candidate.companyName,
    campaignTitle: candidate.campaignTitle,
    assetIds: candidate.assetIds,
    filenames: candidate.filenames,
    ok: true,
    dryRun,
  }

  if (dryRun) {
    return {
      ...base,
      deletedDocument: false,
      deletedAssets: [],
    }
  }

  try {
    await client.delete(candidate._id)

    const deletedAssets: string[] = []
    for (const assetId of candidate.assetIds) {
      const status = await deleteAssetIfPresent(client, assetId)
      if (status === 'deleted') deletedAssets.push(assetId)
    }

    return {
      ...base,
      deletedDocument: true,
      deletedAssets,
    }
  } catch (error) {
    return {
      ...base,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function purgeExpiredCampaignBriefAttachments(options?: {
  client?: SanityClient
  now?: Date
  dryRun?: boolean
}): Promise<{
  cutoff: string
  retentionDays: number
  dryRun: boolean
  total: number
  deleted: number
  failed: number
  results: CampaignBriefPurgeResult[]
}> {
  const client = options?.client ?? getSanityWriteClient()
  const now = options?.now ?? new Date()
  const dryRun = Boolean(options?.dryRun)
  const cutoff = campaignBriefPurgeCutoff(now)

  const candidates = await findExpiredCampaignBriefAttachments(client, now)
  const results: CampaignBriefPurgeResult[] = []
  for (const candidate of candidates) {
    results.push(await purgeOne(client, candidate, dryRun))
  }

  const deleted = results.filter((r) => r.ok && !r.dryRun && r.deletedDocument).length
  const failed = results.filter((r) => !r.ok).length

  return {
    cutoff,
    retentionDays: CAMPAIGN_BRIEF_RETENTION_DAYS,
    dryRun,
    total: results.length,
    deleted: dryRun ? 0 : deleted,
    failed,
    results,
  }
}
