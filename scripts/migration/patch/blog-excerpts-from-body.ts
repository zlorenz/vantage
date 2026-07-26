/**
 * Move blog body lead paragraphs into excerpt / excerptZh, then strip them
 * from body / bodyZh. Leads are the first non-empty text block (typically the
 * opening h3 used as a card teaser on the live site).
 *
 *   npx tsx scripts/migration/patch/blog-excerpts-from-body.ts --dry-run
 *   npx tsx scripts/migration/patch/blog-excerpts-from-body.ts
 */

import {getWriteClient} from '../lib/sanity-client'

type PtSpan = {_type?: string; text?: string}
type PtBlock = {
  _type?: string
  _key?: string
  style?: string
  listItem?: string
  children?: PtSpan[]
}

type BlogDoc = {
  _id: string
  title?: string
  slug?: string
  excerpt?: string
  excerptZh?: string
  body?: PtBlock[]
  bodyZh?: PtBlock[]
}

const dryRun = process.argv.includes('--dry-run')

function plainText(block: PtBlock | undefined): string {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return ''
  return block.children
    .filter((c) => (c._type ?? 'span') === 'span')
    .map((c) => c.text ?? '')
    .join('')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isEmptyBlock(block: PtBlock): boolean {
  return block._type === 'block' && !plainText(block) && !block.listItem
}

/** First non-empty text block → excerpt; drop leading empties + that block. */
function extractLead(blocks: PtBlock[] | undefined): {
  excerpt: string | undefined
  remaining: PtBlock[] | undefined
  style?: string
} {
  if (!blocks?.length) return {excerpt: undefined, remaining: blocks}

  let i = 0
  while (i < blocks.length && isEmptyBlock(blocks[i]!)) i += 1
  if (i >= blocks.length) {
    return {excerpt: undefined, remaining: blocks.filter((b) => !isEmptyBlock(b))}
  }

  const lead = blocks[i]!
  if (lead._type !== 'block' || lead.listItem) {
    // Don't pull images / lists / embeds into excerpt.
    return {excerpt: undefined, remaining: blocks.slice(i)}
  }

  const excerpt = plainText(lead)
  if (!excerpt) return {excerpt: undefined, remaining: blocks.slice(i)}

  const remaining = blocks.slice(i + 1).filter((b, idx) => !(idx === 0 && isEmptyBlock(b)))
  // Also drop a trailing empty that was sandwiched after the lead.
  return {excerpt, remaining, style: lead.style}
}

async function main() {
  const client = getWriteClient()
  const docs = await client.fetch<BlogDoc[]>(`*[_type == "blogPost" && !(_id in path("drafts.**"))]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    excerptZh,
    body,
    bodyZh
  }`)

  console.log(`${dryRun ? '[dry-run] ' : ''}Posts: ${docs.length}`)

  let patched = 0
  for (const doc of docs) {
    const en = extractLead(doc.body)
    const zh = extractLead(doc.bodyZh)

    const nextExcerpt = en.excerpt
    const nextExcerptZh = zh.excerpt

    const set: Record<string, unknown> = {}
    const changes: string[] = []

    if (nextExcerpt && nextExcerpt !== doc.excerpt) {
      set.excerpt = nextExcerpt
      changes.push(`excerpt←${en.style ?? 'block'}(${nextExcerpt.slice(0, 60)}…)`)
    }
    if (nextExcerptZh && nextExcerptZh !== doc.excerptZh) {
      set.excerptZh = nextExcerptZh
      changes.push(`excerptZh←${zh.style ?? 'block'}(${nextExcerptZh.slice(0, 40)}…)`)
    }
    if (en.excerpt && en.remaining && en.remaining.length !== (doc.body?.length ?? 0)) {
      set.body = en.remaining
      changes.push(`body ${doc.body?.length ?? 0}→${en.remaining.length}`)
    }
    if (zh.excerpt && zh.remaining && zh.remaining.length !== (doc.bodyZh?.length ?? 0)) {
      set.bodyZh = zh.remaining
      changes.push(`bodyZh ${doc.bodyZh?.length ?? 0}→${zh.remaining.length}`)
    }

    if (!Object.keys(set).length) {
      console.log(`  skip ${doc.slug ?? doc._id} (nothing to move)`)
      continue
    }

    console.log(`  ${doc.slug ?? doc._id}: ${changes.join('; ')}`)
    if (!dryRun) {
      await client.patch(doc._id).set(set).commit({autoGenerateArrayKeys: true})
    }
    patched += 1
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}Done: ${patched}/${docs.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
