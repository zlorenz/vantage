/**
 * One-off: create a draft `page` document with slug `home-redesign`.
 *
 * Usage: npx tsx scripts/migration/patch/create-home-redesign-page-draft.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import {getWriteClient} from '../lib/sanity-client'
import '../config'

const PUBLISHED_ID = 'page-home-redesign'
const DRAFT_ID = `drafts.${PUBLISHED_ID}`
const SLUG = 'home-redesign'

async function main() {
  const client = getWriteClient()

  const existing = await client.fetch<
    {_id: string; title?: string; slug?: string}[]
  >(
    `*[_type == "page" && slug.current == $slug]{
      _id,
      title,
      "slug": slug.current
    }`,
    {slug: SLUG},
  )

  if (existing.length > 0) {
    console.log(
      `Abort: page with slug "${SLUG}" already exists:`,
      existing.map((d) => `${d._id} (${d.title ?? 'untitled'})`).join(', '),
    )
    process.exit(1)
  }

  const byId = await client.fetch<{_id: string} | null>(
    `*[_id in [$draftId, $publishedId]][0]{_id}`,
    {draftId: DRAFT_ID, publishedId: PUBLISHED_ID},
  )
  if (byId) {
    console.log(`Abort: document id already exists: ${byId._id}`)
    process.exit(1)
  }

  await client.create({
    _id: DRAFT_ID,
    _type: 'page',
    title: 'Homepage Redesign',
    slug: {_type: 'slug', current: SLUG},
  })

  console.log(`Created draft page: ${DRAFT_ID} (slug: ${SLUG})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
