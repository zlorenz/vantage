/**
 * One-time: set creditLine on existing campaign-brief test attachments so
 * they show "Campaign brief upload — auto-deletes after 30 days" in the
 * Media plugin Credit field.
 *
 * Same identification as tag-campaign-brief-external-uploads.ts:
 * assets referenced by any campaignBriefAttachment document, plus a
 * Mammotion filename fallback for orphans from failed submits.
 *
 * Usage: npx tsx scripts/migration/patch/label-campaign-brief-credit-lines.ts
 */

import '../config'
import {getWriteClient} from '../lib/sanity-client'
import {
  EXTERNAL_UPLOAD_CREDIT_LINE,
  EXTERNAL_UPLOAD_TAG_ID,
  setExternalUploadCreditLine,
} from '../../../shared/media-tags'

type AssetHit = {
  _id: string
  originalFilename?: string
  creditLine?: string | null
}

async function main() {
  const client = getWriteClient()

  const fromBriefDocs = await client.fetch<AssetHit[]>(
    `*[_type == "campaignBriefAttachment"].files[].file.asset->{
      _id,
      originalFilename,
      creditLine
    }`,
  )

  const mammotionFallback = await client.fetch<AssetHit[]>(
    `*[_type == "sanity.fileAsset"
      && !(_id in path("drafts.**"))
      && originalFilename match "*ammotion*"
    ]{
      _id,
      originalFilename,
      creditLine
    }`,
  )

  // Prefer already-tagged external-upload assets when present.
  const tagged = await client.fetch<AssetHit[]>(
    `*[references($tagId) && (_type == "sanity.imageAsset" || _type == "sanity.fileAsset")
      && !(_id in path("drafts.**"))
    ]{
      _id,
      originalFilename,
      creditLine
    }`,
    {tagId: EXTERNAL_UPLOAD_TAG_ID},
  )

  const byId = new Map<string, AssetHit>()
  for (const hit of [...fromBriefDocs, ...mammotionFallback, ...tagged]) {
    if (!hit?._id) continue
    byId.set(hit._id, hit)
  }

  const assets = [...byId.values()]
  console.log(`Found ${assets.length} asset(s) to consider for creditLine labeling.`)
  console.log(`Credit line: ${EXTERNAL_UPLOAD_CREDIT_LINE}`)
  console.log('Before:')
  for (const a of assets) {
    console.log(
      `  ${a._id}  ${a.originalFilename ?? '(no filename)'}  creditLine=${JSON.stringify(a.creditLine ?? null)}`,
    )
  }

  if (assets.length === 0) {
    console.log('Nothing to label.')
    return
  }

  for (const a of assets) {
    await setExternalUploadCreditLine(client, a._id)
  }

  const after = await client.fetch<AssetHit[]>(
    `*[_id in $ids]{_id, originalFilename, creditLine}`,
    {ids: assets.map((a) => a._id)},
  )

  console.log('After:')
  for (const a of after) {
    console.log(
      `  ${a._id}  ${a.originalFilename ?? '(no filename)'}  creditLine=${JSON.stringify(a.creditLine ?? null)}`,
    )
  }

  const missing = after.filter((a) => a.creditLine !== EXTERNAL_UPLOAD_CREDIT_LINE)
  if (missing.length > 0) {
    throw new Error(
      `Failed to set creditLine on ${missing.length} asset(s): ${missing.map((a) => a._id).join(', ')}`,
    )
  }
  console.log(`OK — ${after.length} asset(s) labeled with creditLine.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
