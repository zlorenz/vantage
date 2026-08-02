/**
 * Campaign-brief attachment retention — shared by the Next purge cron.
 * Keep dependency-free so Studio/Next can import it cleanly (same pattern as
 * shared/trash-retention).
 */

export const CAMPAIGN_BRIEF_RETENTION_DAYS = 30

/** ISO cutoff: documents with `_createdAt` strictly before this are expired. */
export function campaignBriefPurgeCutoff(now: Date = new Date()): string {
  const d = new Date(now.getTime())
  d.setUTCDate(d.getUTCDate() - CAMPAIGN_BRIEF_RETENTION_DAYS)
  return d.toISOString()
}
