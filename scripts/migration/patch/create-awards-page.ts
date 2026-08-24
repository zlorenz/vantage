/**
 * One-off: create a published `page` document with slug `awards`.
 *
 * New Sanity doc for the "Awards" page. Mirrors
 * create-our-industry-page.ts (published, not a draft, so the public site's
 * unauthenticated sanityClient can resolve it immediately). There is no
 * create-our-company-page.ts yet (that page hasn't been built) — this
 * script mirrors the our-industry precedent instead.
 *
 * PLACEHOLDER CONTENT — entirely invented, flagged for follow-up:
 * - This is fictional/invented content. No real award data exists. The
 *   awardItems entries below use deliberately generic/obviously-placeholder
 *   naming (e.g. "Sample Award Category") — none reference real festivals,
 *   real client work, or anything that could be mistaken for a real claim.
 * - titleZh / slugZh are intentionally left unset (no Chinese translation
 *   yet).
 * - `body` holds a short placeholder paragraph (schema requires it).
 * - awardItems[].portfolioEntry refs are intentionally left unset.
 *
 * Usage: npx tsx scripts/migration/patch/create-awards-page.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import {getWriteClient} from '../lib/sanity-client'
import '../config'

const PUBLISHED_ID = 'page-awards'
const SLUG = 'awards'

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

const PLACEHOLDER_AWARD_ITEMS = [
  {title: 'Sample Award Category', category: 'Best Commercial (Placeholder)', year: 2023},
  {title: 'Sample Festival Selection', category: 'Official Selection (Placeholder)', year: 2023},
  {title: 'Sample Craft Award', category: 'Cinematography (Placeholder)', year: 2024},
  {title: 'Sample Industry Honor', category: 'Production Excellence (Placeholder)', year: 2024},
  {title: 'Sample Regional Award', category: 'Brand Film (Placeholder)', year: 2025},
]

async function main() {
  const client = getWriteClient()

  const existingBySlug = await client.fetch<
    {_id: string; title?: string; slug?: string}[]
  >(
    `*[_type == "page" && slug.current == $slug]{
      _id,
      title,
      "slug": slug.current
    }`,
    {slug: SLUG},
  )

  if (existingBySlug.length > 0) {
    console.log(
      `Abort: page with slug "${SLUG}" already exists:`,
      existingBySlug.map((d) => `${d._id} (${d.title ?? 'untitled'})`).join(', '),
    )
    process.exit(1)
  }

  const existingById = await client.fetch<{_id: string} | null>(
    `*[_id in [$draftId, $publishedId]][0]{_id}`,
    {draftId: `drafts.${PUBLISHED_ID}`, publishedId: PUBLISHED_ID},
  )
  if (existingById) {
    console.log(`Abort: document id already exists: ${existingById._id}`)
    process.exit(1)
  }

  await client.create({
    _id: PUBLISHED_ID,
    _type: 'page',
    title: 'Awards',
    slug: {_type: 'slug', current: SLUG},
    showHeroHeader: true,
    heroTitle: 'Our <span class="vp-outline">Awards</span>',
    // PLACEHOLDER — replace with real copy in Studio.
    body: [
      {
        _type: 'block',
        _key: newKey(),
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: newKey(),
            text:
              'Recognition from industry festivals and award bodies — to be finalized as real results come in.',
            marks: [],
          },
        ],
      },
    ],
    // PLACEHOLDER — entirely invented entries, obviously fictional naming.
    awardItems: PLACEHOLDER_AWARD_ITEMS.map((item) => ({
      _type: 'awardItem' as const,
      _key: newKey(),
      title: item.title,
      category: item.category,
      year: item.year,
    })),
  })

  console.log(`Created published page: ${PUBLISHED_ID} (slug: ${SLUG})`)

  // Read-back confirmation — do not trust the create() resolving without error alone.
  const readBack = await client.fetch<{
    _id: string
    _type: string
    title?: string
    slug?: string
    heroTitle?: string
    body?: unknown[]
    awardItems?: {title?: string; category?: string; year?: number}[]
  } | null>(
    `*[_id == $id][0]{
      _id,
      _type,
      title,
      "slug": slug.current,
      heroTitle,
      body,
      awardItems[]{title, category, year}
    }`,
    {id: PUBLISHED_ID},
  )

  if (!readBack) {
    console.error(`Read-back FAILED: "${PUBLISHED_ID}" not found after create().`)
    process.exit(1)
  }

  console.log('Read-back confirmation:')
  console.log(JSON.stringify(readBack, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
