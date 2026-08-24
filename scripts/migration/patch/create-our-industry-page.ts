/**
 * One-off: create a published `page` document with slug `our-industry`.
 *
 * New Sanity doc for the "Our Industry" hub page (links to the existing
 * industry / market / video-format taxonomy archives). Created directly as
 * a PUBLISHED document (not a draft, unlike create-home-redesign-page-draft.ts)
 * so the public site — which reads via the unauthenticated `sanityClient` —
 * can resolve it immediately without a preview token.
 *
 * PLACEHOLDER CONTENT — flagged for follow-up:
 * - titleZh / slugZh are intentionally left unset. No real Chinese
 *   translation exists yet; the page route and routing.ts pathnames config
 *   fall back to an English-only placeholder path.
 * - `body` holds a short placeholder paragraph so the required Portable Text
 *   field is non-empty (schema requires `body`). Replace with real copy in
 *   Studio before this page is considered final.
 *
 * Usage: npx tsx scripts/migration/patch/create-our-industry-page.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import {getWriteClient} from '../lib/sanity-client'
import '../config'

const PUBLISHED_ID = 'page-our-industry'
const SLUG = 'our-industry'

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

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
    title: 'Our Industry',
    slug: {_type: 'slug', current: SLUG},
    showHeroHeader: true,
    heroTitle: 'Our <span class="vp-outline">Industry</span>',
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
              'Explore our work by industry, market, and video format below. (Placeholder copy — replace in Studio.)',
            marks: [],
          },
        ],
      },
    ],
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
  } | null>(
    `*[_id == $id][0]{
      _id,
      _type,
      title,
      "slug": slug.current,
      heroTitle,
      body
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
