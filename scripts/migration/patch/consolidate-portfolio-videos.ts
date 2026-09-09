/**
 * Backfill portfolioEntry.videos[] from legacy main-film fields + additionalVideos.
 *
 * Option A: keep document-level featuredImage and leave legacy video fields in
 * place for dual-read. Does not unset vimeoUrl / heroFilmTitle / additionalVideos.
 *
 * Idempotent: skips docs that already have a non-empty videos array.
 *
 * Usage:
 *   npx tsx scripts/migration/patch/consolidate-portfolio-videos.ts
 *   npx tsx scripts/migration/patch/consolidate-portfolio-videos.ts --apply
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local for --apply.
 */

import {getWriteClient} from '../lib/sanity-client'
import '../config'

type LegacyAdditional = {
  _key?: string
  _type?: string
  vimeoUrl?: string
  xinpianchangUrl?: string
  videoTitle?: string
  videoTitleZh?: string
  description?: string
  descriptionZh?: string
}

type PortfolioDoc = {
  _id: string
  vimeoUrl?: string
  xinpianchangUrl?: string
  heroFilmTitle?: string
  heroFilmTitleZh?: string
  previewCleanVimeoUrl?: string
  previewStartSeconds?: number
  previewEndSeconds?: number
  videos?: unknown[] | null
  additionalVideos?: LegacyAdditional[] | null
}

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

function trimOrOmit(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function buildVideos(doc: PortfolioDoc) {
  const main = {
    _type: 'portfolioVideo' as const,
    _key: newKey(),
    vimeoUrl: trimOrOmit(doc.vimeoUrl),
    xinpianchangUrl: trimOrOmit(doc.xinpianchangUrl),
    videoTitle: trimOrOmit(doc.heroFilmTitle),
    videoTitleZh: trimOrOmit(doc.heroFilmTitleZh),
    previewCleanVimeoUrl: trimOrOmit(doc.previewCleanVimeoUrl),
    previewStartSeconds: doc.previewStartSeconds,
    previewEndSeconds: doc.previewEndSeconds,
  }

  const additionals = (doc.additionalVideos ?? []).map((row) => ({
    _type: 'portfolioVideo' as const,
    _key: row._key && row._key.length > 0 ? row._key : newKey(),
    vimeoUrl: trimOrOmit(row.vimeoUrl),
    xinpianchangUrl: trimOrOmit(row.xinpianchangUrl),
    videoTitle: trimOrOmit(row.videoTitle),
    videoTitleZh: trimOrOmit(row.videoTitleZh),
    description: trimOrOmit(row.description),
    descriptionZh: trimOrOmit(row.descriptionZh),
  }))

  // Drop empty URL shells from additionals; keep main even if URL missing so
  // editors can fix in Studio (validation will flag it).
  const extras = additionals.filter((row) => row.vimeoUrl || row.xinpianchangUrl)

  if (!main.vimeoUrl && !main.xinpianchangUrl && extras.length === 0) {
    return null
  }

  // Omit undefined keys for cleaner patches.
  const compact = <T extends Record<string, unknown>>(row: T) => {
    const next: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      if (value !== undefined) next[key] = value
    }
    return next
  }

  return [compact(main), ...extras.map(compact)]
}

async function main() {
  const apply = process.argv.includes('--apply')
  const client = getWriteClient()

  const docs = await client.fetch<PortfolioDoc[]>(
    `*[_type == "portfolioEntry" && !(_id in path("versions.**"))]{
      _id,
      vimeoUrl,
      xinpianchangUrl,
      heroFilmTitle,
      heroFilmTitleZh,
      previewCleanVimeoUrl,
      previewStartSeconds,
      previewEndSeconds,
      videos,
      additionalVideos[]{
        _key,
        _type,
        vimeoUrl,
        xinpianchangUrl,
        videoTitle,
        videoTitleZh,
        description,
        descriptionZh
      }
    }`,
  )

  let skipped = 0
  let empty = 0
  let wouldPatch = 0
  let patched = 0

  for (const doc of docs) {
    if (Array.isArray(doc.videos) && doc.videos.length > 0) {
      skipped++
      continue
    }

    const videos = buildVideos(doc)
    if (!videos) {
      empty++
      console.warn(`${doc._id}: no legacy video URLs — skipped`)
      continue
    }

    wouldPatch++
    const summary = `${doc._id}: videos=${videos.length} (main + ${videos.length - 1} extras)`
    if (!apply) {
      console.log(`[dry-run] ${summary}`)
      continue
    }

    await client.patch(doc._id).set({videos}).commit({autoGenerateArrayKeys: false})
    patched++
    console.log(`[apply] ${summary}`)
  }

  console.log(
    apply
      ? `Done. patched=${patched} skippedExisting=${skipped} empty=${empty}`
      : `Dry-run. wouldPatch=${wouldPatch} skippedExisting=${skipped} empty=${empty}. Re-run with --apply to write.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
