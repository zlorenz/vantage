/**
 * One-off: seed drafts.page-home-redesign.carouselSlides from the
 * hardcoded prototype carousel slug list (same order).
 *
 * Usage: npx tsx scripts/migration/patch/seed-home-redesign-carousel-slides.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import {PROTOTYPE_CAROUSEL_SLUGS} from '../../../src/components/prototype/carousel/slugs'
import {getWriteClient} from '../lib/sanity-client'
import '../config'

const DRAFT_ID = 'drafts.page-home-redesign'

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

function publishedId(id: string): string {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
}

async function main() {
  const client = getWriteClient()

  const page = await client.fetch<{_id: string} | null>(
    `*[_id == $id][0]{_id}`,
    {id: DRAFT_ID},
  )
  if (!page) {
    console.error(`Abort: ${DRAFT_ID} not found`)
    process.exit(1)
  }

  const resolved: {slug: string; id: string}[] = []
  const missing: string[] = []

  for (const slug of PROTOTYPE_CAROUSEL_SLUGS) {
    const id = await client.fetch<string | null>(
      `*[_type == "portfolioEntry" && slug.current == $slug][0]._id`,
      {slug},
    )
    if (!id) {
      missing.push(slug)
      continue
    }
    resolved.push({slug, id: publishedId(id)})
  }

  if (missing.length > 0) {
    console.error(
      `Abort: ${missing.length} slug(s) failed to resolve — no write:`,
      missing.join(', '),
    )
    process.exit(1)
  }

  const carouselSlides = resolved.map(({id}) => ({
    _type: 'reference' as const,
    _ref: id,
    _key: newKey(),
  }))

  await client.patch(DRAFT_ID).set({carouselSlides}).commit()

  console.log(
    `Patched ${DRAFT_ID}.carouselSlides (${carouselSlides.length} refs):`,
  )
  for (const row of resolved) {
    console.log(`  ${row.slug} -> ${row.id}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
