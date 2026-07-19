/**
 * Quick verification of Sanity asset SEO metadata after WP migration.
 *   npx tsx scripts/migration/audit/asset-metadata.ts
 */

import {getWriteClient} from '../lib/sanity-client'

async function main() {
  const client = getWriteClient()
  const assets = await client.fetch<
    Array<{
      _id: string
      title?: string
      altText?: string
      description?: string
      originalFilename?: string
    }>
  >(`*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]{
    _id, title, altText, description, originalFilename
  }`)

  const withAlt = assets.filter((a) => a.altText?.trim()).length
  const withTitle = assets.filter((a) => a.title?.trim()).length
  const withDesc = assets.filter((a) => a.description?.trim()).length
  const missingBoth = assets.filter(
    (a) => !a.altText?.trim() && !a.title?.trim(),
  )

  console.log(`Sanity assets: ${assets.length}`)
  console.log(`  with title:       ${withTitle}`)
  console.log(`  with altText:     ${withAlt}`)
  console.log(`  with description: ${withDesc}`)
  console.log(`  missing title+alt:${missingBoth.length}`)

  if (missingBoth.length) {
    console.log('\nStill missing title and alt (sample):')
    for (const a of missingBoth.slice(0, 15)) {
      console.log(`  ${a._id}  ${a.originalFilename ?? ''}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
