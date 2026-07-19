/**
 * Audit + migrate WordPress attachment SEO metadata onto Sanity assets.
 *
 * Maps WP → Sanity via migration-data/id-map.json (primary), then
 * originalFilename basename fallback for unmapped assets.
 *
 * WP → Sanity fields (SEO priority):
 *   _wp_attachment_image_alt  → altText
 *   post_title                → title
 *   post_excerpt (caption)    → description (preferred)
 *   post_content (description)→ description (fallback if excerpt empty)
 *
 * Only fills empty Sanity fields (never overwrites existing metadata).
 *
 *   npx tsx scripts/migration/patch/asset-metadata-from-wp.ts --dry-run
 *   npx tsx scripts/migration/patch/asset-metadata-from-wp.ts
 */

import path from 'node:path'
import {PATHS} from '../config'
import {closePool, query, table} from '../db'
import {writeJson} from '../lib/fs'
import {loadIdMap} from '../lib/id-map'
import {getWriteClient} from '../lib/sanity-client'

interface WpAttachment {
  ID: number
  post_title: string | null
  post_excerpt: string | null
  post_content: string | null
  post_mime_type: string | null
  attached_file: string | null
  alt: string | null
}

interface SanityAsset {
  _id: string
  _type: string
  originalFilename?: string
  title?: string
  altText?: string
  description?: string
  mimeType?: string
  size?: number
}

interface PatchPlan {
  wpId: number | null
  assetId: string
  match: 'id-map' | 'filename'
  relativePath?: string
  set: {title?: string; altText?: string; description?: string}
  skipped: {title?: string; altText?: string; description?: string}
  wp: {title?: string; alt?: string; caption?: string; description?: string}
}

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  // WP attachment titles often use <br> between name and location
  const withoutHtml = value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
  const trimmed = withoutHtml.replace(/\s+/g, ' ').trim()
  return trimmed || undefined
}

function basenameOf(filePath: string | null | undefined): string | undefined {
  if (!filePath) return undefined
  return path.basename(filePath).toLowerCase() || undefined
}

function isBlank(value: string | null | undefined): boolean {
  return !value?.trim()
}

async function loadWpAttachments(): Promise<WpAttachment[]> {
  return query<WpAttachment[]>(
    `SELECT
       p.ID,
       p.post_title,
       p.post_excerpt,
       p.post_content,
       p.post_mime_type,
       (SELECT meta_value FROM ${table('postmeta')}
         WHERE post_id = p.ID AND meta_key = '_wp_attached_file' LIMIT 1) AS attached_file,
       (SELECT meta_value FROM ${table('postmeta')}
         WHERE post_id = p.ID AND meta_key = '_wp_attachment_image_alt' LIMIT 1) AS alt
     FROM ${table('posts')} p
     WHERE p.post_type = 'attachment'
       AND p.post_status IN ('inherit', 'private')`,
  )
}

function buildPlan(
  wp: WpAttachment,
  asset: SanityAsset,
  match: 'id-map' | 'filename',
): PatchPlan | null {
  const title = clean(wp.post_title)
  const alt = clean(wp.alt)
  const caption = clean(wp.post_excerpt)
  const description = clean(wp.post_content)
  // Prefer caption for description — it's the public-facing SEO field in WP media
  const desc = caption ?? description

  const set: PatchPlan['set'] = {}
  const skipped: PatchPlan['skipped'] = {}

  if (title) {
    if (isBlank(asset.title)) set.title = title
    else skipped.title = asset.title
  }
  if (alt) {
    if (isBlank(asset.altText)) set.altText = alt
    else skipped.altText = asset.altText
  }
  if (desc) {
    if (isBlank(asset.description)) set.description = desc
    else skipped.description = asset.description
  }

  if (!Object.keys(set).length) return null

  return {
    wpId: wp.ID,
    assetId: asset._id,
    match,
    relativePath: wp.attached_file ?? undefined,
    set,
    skipped,
    wp: {title, alt, caption, description},
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const client = getWriteClient()
  const idMap = loadIdMap()

  console.log(dryRun ? 'DRY RUN — no writes\n' : 'APPLYING patches\n')

  const [wpRows, assets] = await Promise.all([
    loadWpAttachments(),
    client.fetch<SanityAsset[]>(`*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]{
      _id, _type, originalFilename, title, altText, description, mimeType, size
    }`),
  ])

  const wpById = new Map(wpRows.map((r) => [r.ID, r]))
  const assetById = new Map(assets.map((a) => [a._id, a]))

  // Filename index for fallback — prefer unique basenames only
  const assetsByFilename = new Map<string, SanityAsset[]>()
  for (const asset of assets) {
    const name = basenameOf(asset.originalFilename)
    if (!name) continue
    const list = assetsByFilename.get(name) ?? []
    list.push(asset)
    assetsByFilename.set(name, list)
  }

  const plans: PatchPlan[] = []
  const matchedAssetIds = new Set<string>()
  const unmatchedWpUseful: Array<{
    wpId: number
    relativePath?: string
    hasAlt: boolean
    hasTitle: boolean
    hasDesc: boolean
  }> = []

  // Primary: id-map
  for (const [wpIdStr, assetId] of Object.entries(idMap.assets)) {
    const wpId = Number(wpIdStr)
    const wp = wpById.get(wpId)
    const asset = assetById.get(assetId)
    if (!wp || !asset) continue
    matchedAssetIds.add(assetId)
    const plan = buildPlan(wp, asset, 'id-map')
    if (plan) plans.push(plan)
  }

  // Fallback: unique filename match for WP attachments not already matched
  for (const wp of wpRows) {
    const mappedId = idMap.assets[String(wp.ID)]
    if (mappedId && matchedAssetIds.has(mappedId)) continue

    const name = basenameOf(wp.attached_file)
    if (!name) continue
    const candidates = (assetsByFilename.get(name) ?? []).filter(
      (a) => !matchedAssetIds.has(a._id),
    )
    if (candidates.length !== 1) {
      const title = clean(wp.post_title)
      const alt = clean(wp.alt)
      const desc = clean(wp.post_excerpt) ?? clean(wp.post_content)
      if (alt || title || desc) {
        unmatchedWpUseful.push({
          wpId: wp.ID,
          relativePath: wp.attached_file ?? undefined,
          hasAlt: Boolean(alt),
          hasTitle: Boolean(title),
          hasDesc: Boolean(desc),
        })
      }
      continue
    }

    const asset = candidates[0]
    matchedAssetIds.add(asset._id)
    const plan = buildPlan(wp, asset, 'filename')
    if (plan) plans.push(plan)
  }

  const wpWithAlt = wpRows.filter((r) => clean(r.alt)).length
  const wpWithTitle = wpRows.filter((r) => clean(r.post_title)).length
  const wpWithCaption = wpRows.filter((r) => clean(r.post_excerpt)).length
  const wpWithDesc = wpRows.filter((r) => clean(r.post_content)).length

  const sanityMissingAlt = assets.filter((a) => isBlank(a.altText)).length
  const sanityMissingTitle = assets.filter((a) => isBlank(a.title)).length
  const sanityMissingDesc = assets.filter((a) => isBlank(a.description)).length

  console.log('=== Audit ===')
  console.log(`WP attachments:              ${wpRows.length}`)
  console.log(`  with alt:                  ${wpWithAlt}`)
  console.log(`  with title:                ${wpWithTitle}`)
  console.log(`  with caption (excerpt):    ${wpWithCaption}`)
  console.log(`  with description (content):${wpWithDesc}`)
  console.log(`Sanity assets:               ${assets.length}`)
  console.log(`  missing altText:           ${sanityMissingAlt}`)
  console.log(`  missing title:             ${sanityMissingTitle}`)
  console.log(`  missing description:       ${sanityMissingDesc}`)
  console.log(`id-map assets:               ${Object.keys(idMap.assets).length}`)
  console.log(`Patch plans:                 ${plans.length}`)
  console.log(
    `  via id-map:                ${plans.filter((p) => p.match === 'id-map').length}`,
  )
  console.log(
    `  via filename:              ${plans.filter((p) => p.match === 'filename').length}`,
  )
  console.log(`WP useful but unmatched:     ${unmatchedWpUseful.length}`)

  const fieldCounts = {altText: 0, title: 0, description: 0}
  for (const plan of plans) {
    if (plan.set.altText) fieldCounts.altText++
    if (plan.set.title) fieldCounts.title++
    if (plan.set.description) fieldCounts.description++
  }
  console.log('\nFields to fill:')
  console.log(`  altText:      ${fieldCounts.altText}`)
  console.log(`  title:        ${fieldCounts.title}`)
  console.log(`  description:  ${fieldCounts.description}`)

  const auditPath = path.join(PATHS.migrationData, 'asset-metadata-audit.json')
  writeJson(auditPath, {
    generatedAt: new Date().toISOString(),
    dryRun,
    summary: {
      wpAttachments: wpRows.length,
      wpWithAlt,
      wpWithTitle,
      wpWithCaption,
      wpWithDesc,
      sanityAssets: assets.length,
      sanityMissingAlt,
      sanityMissingTitle,
      sanityMissingDesc,
      planCount: plans.length,
      fieldCounts,
      unmatchedWpUseful: unmatchedWpUseful.length,
    },
    plans,
    unmatchedWpUseful: unmatchedWpUseful.slice(0, 200),
  })
  console.log(`\nWrote audit → ${auditPath}`)

  if (dryRun) {
    console.log('\nSample plans (first 8):')
    for (const plan of plans.slice(0, 8)) {
      console.log(
        `  wp ${plan.wpId} → ${plan.assetId} [${plan.match}]`,
        plan.set,
      )
    }
    await closePool()
    return
  }

  let patched = 0
  let errors = 0
  for (const plan of plans) {
    try {
      await client.patch(plan.assetId).set(plan.set).commit()
      patched++
      if (patched % 25 === 0) console.log(`  …patched ${patched}/${plans.length}`)
    } catch (err) {
      errors++
      console.error(`Failed ${plan.assetId} (wp ${plan.wpId}):`, err)
    }
  }

  console.log(`\nDone: ${patched} assets patched, ${errors} errors.`)
  await closePool()
}

main().catch(async (err) => {
  console.error(err)
  await closePool().catch(() => undefined)
  process.exit(1)
})
