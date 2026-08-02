/**
 * One-time: tag existing campaign-brief test attachments as `external-upload`
 * so they drop out of the editorial Media tool.
 *
 * Identification: assets referenced by any campaignBriefAttachment document,
 * plus a Mammotion filename fallback for orphans from failed submits.
 *
 * Usage: npx tsx scripts/migration/patch/tag-campaign-brief-external-uploads.ts
 */

import '../config'
import {getWriteClient} from '../lib/sanity-client'
import {
  EXTERNAL_UPLOAD_TAG_ID,
  EXTERNAL_UPLOAD_TAG_NAME,
  tagAssetAsExternalUpload,
} from '../../../shared/media-tags'

type AssetHit = {
  _id: string
  originalFilename?: string
  alreadyTagged?: boolean
}

async function main() {
  const client = getWriteClient()

  const fromBriefDocs = await client.fetch<AssetHit[]>(
    `*[_type == "campaignBriefAttachment"].files[].file.asset->{
      _id,
      originalFilename,
      "alreadyTagged": count(opt.media.tags[_ref == $tagId]) > 0
    }`,
    {tagId: EXTERNAL_UPLOAD_TAG_ID},
  )

  // Filename fallback for test uploads that never got a campaignBriefAttachment doc.
  const mammotionFallback = await client.fetch<AssetHit[]>(
    `*[_type == "sanity.fileAsset"
      && !(_id in path("drafts.**"))
      && originalFilename match "*ammotion*"
    ]{
      _id,
      originalFilename,
      "alreadyTagged": count(opt.media.tags[_ref == $tagId]) > 0
    }`,
    {tagId: EXTERNAL_UPLOAD_TAG_ID},
  )

  const byId = new Map<string, AssetHit>()
  for (const hit of [...fromBriefDocs, ...mammotionFallback]) {
    if (!hit?._id) continue
    byId.set(hit._id, hit)
  }

  const assets = [...byId.values()]
  console.log(
    `Found ${assets.length} asset(s) to consider (campaignBriefAttachment refs + Mammotion filename fallback).`,
  )
  console.log(`Tag: ${EXTERNAL_UPLOAD_TAG_NAME} (${EXTERNAL_UPLOAD_TAG_ID})`)
  console.log('Before:')
  for (const a of assets) {
    console.log(
      `  ${a._id}  ${a.originalFilename ?? '(no filename)'}  tagged=${Boolean(a.alreadyTagged)}`,
    )
  }

  if (assets.length === 0) {
    console.log('Nothing to tag.')
    return
  }

  for (const a of assets) {
    await tagAssetAsExternalUpload(client, a._id)
  }

  const after = await client.fetch<AssetHit[]>(
    `*[_id in $ids]{
      _id,
      originalFilename,
      "alreadyTagged": count(opt.media.tags[_ref == $tagId]) > 0
    }`,
    {ids: assets.map((a) => a._id), tagId: EXTERNAL_UPLOAD_TAG_ID},
  )

  console.log('After:')
  for (const a of after) {
    console.log(
      `  ${a._id}  ${a.originalFilename ?? '(no filename)'}  tagged=${Boolean(a.alreadyTagged)}`,
    )
  }

  const untagged = after.filter((a) => !a.alreadyTagged)
  if (untagged.length > 0) {
    throw new Error(`Failed to tag ${untagged.length} asset(s): ${untagged.map((a) => a._id).join(', ')}`)
  }
  console.log(`OK — ${after.length} asset(s) tagged as ${EXTERNAL_UPLOAD_TAG_NAME}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
