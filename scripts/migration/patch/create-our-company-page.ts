/**
 * One-off: create a published `page` document with slug `our-company`.
 *
 * New Sanity doc for the "Our Company" page. Mirrors create-our-industry-page.ts
 * (published, not a draft, so the public site's unauthenticated sanityClient
 * can resolve it immediately).
 *
 * Body composition (verbatim copy-paste into this new doc — not a live
 * reference/link to the source fields):
 *   (a) Home's dormant "Global Commercial Film Production For Ambitious Brands"
 *       heading from messages/en.json Home.aboutHeadingFull (and zh equivalent).
 *       Keys are left untouched in messages — this script only reads them.
 *   (b) About's live "Who We Are" Portable Text blocks — read-only fetch of the
 *       existing `about` page body/bodyZh. "Our Team" heading + founder-name
 *       gallery artifact paragraphs are excluded (same filter intent as
 *       filterAboutBodyBlocks). The about doc is never written.
 *
 * PLACEHOLDER / FLAGS:
 * - titleZh / slugZh intentionally unset (no Chinese route translation yet).
 * - Zh sources: Home.aboutHeadingFull (zh.json) + about.bodyZh "Who We Are"
 *   blocks are both available and copied. If either were missing, bodyZh would
 *   be left unset and flagged below.
 *
 * Usage: npx tsx scripts/migration/patch/create-our-company-page.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {getWriteClient} from '../lib/sanity-client'
import '../config'

const PUBLISHED_ID = 'page-our-company'
const SLUG = 'our-company'

const REPO_ROOT = process.cwd()

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

type PtSpan = {_type?: string; _key?: string; text?: string; marks?: string[]}
type PtBlock = {
  _type?: string
  _key?: string
  style?: string
  markDefs?: unknown[]
  children?: PtSpan[]
  [key: string]: unknown
}

function paragraphBlock(text: string): PtBlock {
  return {
    _type: 'block',
    _key: newKey(),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: newKey(),
        text,
        marks: [],
      },
    ],
  }
}

function getBlockPlainText(block: PtBlock): string {
  if (block._type !== 'block' || !Array.isArray(block.children)) return ''
  return block.children
    .filter((child) => child._type === 'span')
    .map((child) => child.text ?? '')
    .join('')
}

function normalizeHeading(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function isOurTeamHeading(block: PtBlock): boolean {
  if (block._type !== 'block') return false
  if (block.style !== 'h1' && block.style !== 'h2') return false
  const heading = normalizeHeading(getBlockPlainText(block))
  return heading === 'our team' || heading === '我们的团队'
}

/** Drop "Our Team" heading and everything after it (founder gallery artifact). */
function extractWhoWeAreBlocks(blocks: PtBlock[] | null | undefined): PtBlock[] {
  if (!blocks?.length) return []
  const out: PtBlock[] = []
  for (const block of blocks) {
    if (isOurTeamHeading(block)) break
    out.push(block)
  }
  return out
}

/** Deep-copy a Portable Text block with fresh `_key` values (no shared keys). */
function remappedBlock(block: PtBlock): PtBlock {
  const children = Array.isArray(block.children)
    ? block.children.map((child) => ({
        ...child,
        _key: newKey(),
      }))
    : undefined
  const markDefs = Array.isArray(block.markDefs)
    ? block.markDefs.map((def) => {
        if (def && typeof def === 'object' && '_key' in (def as object)) {
          return {...(def as Record<string, unknown>), _key: newKey()}
        }
        return def
      })
    : []
  return {
    ...block,
    _key: newKey(),
    markDefs,
    ...(children ? {children} : {}),
  }
}

function readAboutHeadingFull(locale: 'en' | 'zh'): string {
  const messages = JSON.parse(
    readFileSync(join(REPO_ROOT, `messages/${locale}.json`), 'utf8'),
  ) as {Home?: {aboutHeadingFull?: string}}
  const text = messages.Home?.aboutHeadingFull?.trim()
  if (!text) {
    throw new Error(`Missing Home.aboutHeadingFull in messages/${locale}.json`)
  }
  return text
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

  // (a) Read orphaned Home heading from messages — do not modify those keys.
  const homeHeadingEn = readAboutHeadingFull('en')
  const homeHeadingZh = readAboutHeadingFull('zh')

  // (b) Read-only: About "Who We Are" body. Never patch the about doc.
  const about = await client.fetch<{
    _id: string
    body?: PtBlock[]
    bodyZh?: PtBlock[]
  } | null>(
    `*[_type == "page" && slug.current == "about" && !defined(trash.trashedAt)][0]{
      _id,
      body,
      bodyZh
    }`,
  )

  if (!about) {
    console.error('Abort: about page document not found (read-only query).')
    process.exit(1)
  }

  const whoWeAreEn = extractWhoWeAreBlocks(about.body).map(remappedBlock)
  const whoWeAreZh = extractWhoWeAreBlocks(about.bodyZh).map(remappedBlock)

  if (!whoWeAreEn.length) {
    console.error('Abort: could not extract Who We Are blocks from about.body.')
    process.exit(1)
  }

  const body = [paragraphBlock(homeHeadingEn), ...whoWeAreEn]

  // Zh: both sources available (messages Home.aboutHeadingFull + about.bodyZh).
  // If whoWeAreZh were empty we'd leave bodyZh unset — that is not the case here.
  let bodyZh: PtBlock[] | undefined
  if (whoWeAreZh.length) {
    bodyZh = [paragraphBlock(homeHeadingZh), ...whoWeAreZh]
  } else {
    // FLAG — zh Who We Are blocks not extractable; bodyZh left unset.
    console.warn(
      'FLAG: about.bodyZh Who We Are blocks empty/missing — bodyZh not set on new doc.',
    )
  }

  await client.create({
    _id: PUBLISHED_ID,
    _type: 'page',
    title: 'Our Company',
    slug: {_type: 'slug', current: SLUG},
    showHeroHeader: true,
    heroTitle: 'Our <span class="vp-outline">Company</span>',
    body,
    ...(bodyZh ? {bodyZh} : {}),
  })

  console.log(`Created published page: ${PUBLISHED_ID} (slug: ${SLUG})`)
  console.log(`Source about doc (read-only): ${about._id}`)
  console.log(
    `Body blocks: EN=${body.length} (1 home heading + ${whoWeAreEn.length} Who We Are), ZH=${bodyZh?.length ?? 0}`,
  )

  const readBack = await client.fetch<{
    _id: string
    _type: string
    title?: string
    slug?: string
    heroTitle?: string
    bodyPreview?: {style?: string; text?: string}[]
    bodyZhPreview?: {style?: string; text?: string}[]
  } | null>(
    `*[_id == $id][0]{
      _id,
      _type,
      title,
      "slug": slug.current,
      heroTitle,
      "bodyPreview": body[_type == "block"]{
        style,
        "text": pt::text(@)
      },
      "bodyZhPreview": bodyZh[_type == "block"]{
        style,
        "text": pt::text(@)
      }
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
