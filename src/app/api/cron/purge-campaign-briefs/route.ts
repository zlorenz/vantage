/**
 * Cron: permanently delete campaignBriefAttachment docs older than retention
 * (and their referenced file assets).
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 * Requires SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) server-side.
 *
 * Dry-run: GET ?dryRun=1 (or DRY_RUN=1) — lists candidates without deleting.
 * Scheduled in vercel.json (same daily slot as purge-trash); inert until deploy.
 */

import {NextResponse} from 'next/server'
import {purgeExpiredCampaignBriefAttachments} from '@/lib/campaign-brief-purge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  return header === `Bearer ${secret}`
}

function isDryRun(request: Request): boolean {
  if (process.env.DRY_RUN === '1' || process.env.CAMPAIGN_BRIEF_PURGE_DRY_RUN === '1') {
    return true
  }
  const url = new URL(request.url)
  const q = url.searchParams.get('dryRun') ?? url.searchParams.get('dry-run')
  return q === '1' || q === 'true'
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }

  const dryRun = isDryRun(request)

  try {
    const summary = await purgeExpiredCampaignBriefAttachments({dryRun})

    console.info('[purge-campaign-briefs]', {
      dryRun: summary.dryRun,
      cutoff: summary.cutoff,
      retentionDays: summary.retentionDays,
      total: summary.total,
      deleted: summary.deleted,
      failed: summary.failed,
      documentIds: summary.results.map((r) => r.documentId),
      failures: summary.results
        .filter((r) => !r.ok)
        .map((r) => ({id: r.documentId, error: r.error})),
    })

    return NextResponse.json({
      success: true,
      ...summary,
    })
  } catch (error) {
    console.error('[purge-campaign-briefs] failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      {status: 500},
    )
  }
}
