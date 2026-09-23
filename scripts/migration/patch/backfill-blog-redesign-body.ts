/**
 * Backfill blogPost.redesignBody / redesignBodyZh from live body / bodyZh.
 *
 * Copies each portable-text array verbatim, then converts blockquote-style
 * blocks into pullQuote objects **only inside the redesign copies**.
 * Never patches body / bodyZh.
 *
 * Dry-run (default):
 *   npx tsx scripts/migration/patch/backfill-blog-redesign-body.ts
 *
 * Apply (ONLY after Zach explicit go-ahead + dataset backup):
 *   npx tsx scripts/migration/patch/backfill-blog-redesign-body.ts --apply
 *
 * --apply requires SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) in .env.local.
 *
 * Expected quote conversions (EN + ZH): crowdfunding 1+1, BRINC 4+4,
 * Talking Dog Govee 3+3 → 16 total across 3 docs; 0 on the other 20.
 */

import {createClient} from '@sanity/client'
import {getPortableTextBlockPlainText} from '../../../shared/video-url'
import {SANITY} from '../config'
import {getWriteClient} from '../lib/sanity-client'

const APPLY = process.argv.includes('--apply')

const EXPECTED_POST_COUNT = 23
const EXPECTED_TOTAL_CONVERSIONS = 16

/** Per-slug EN+ZH conversion counts — refuse --apply if live data drifts. */
const EXPECTED_BY_SLUG: ReadonlyMap<string, {en: number; zh: number}> = new Map([
  [
    'how-we-produced-one-of-the-most-successful-crowdfunding-campaigns-in-history',
    {en: 1, zh: 1},
  ],
  [
    'vantage-pictures-translates-next-gen-drone-tech-into-gritty-storytelling-for-brinc',
    {en: 4, zh: 4},
  ],
  [
    'a-talking-dog-ai-and-everyday-chaos-behind-govees-new-campaign-via-vantage-pictures',
    {en: 3, zh: 3},
  ],
])

type PtBlock = Record<string, unknown> & {
  _type?: string
  _key?: string
  style?: string
  children?: unknown
}

type BlogRow = {
  _id: string
  title?: string | null
  slug?: string | null
  body?: PtBlock[] | null
  bodyZh?: PtBlock[] | null
  hasRedesignBody?: boolean
  hasRedesignBodyZh?: boolean
}

type QuoteSample = {key: string; text: string}

type DocReport = {
  id: string
  title: string
  slug: string
  enConversions: number
  zhConversions: number
  enSamples: QuoteSample[]
  zhSamples: QuoteSample[]
  redesignBody: PtBlock[]
  redesignBodyZh: PtBlock[]
  alreadyHasRedesign: boolean
}

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

function deepCopyBlocks(blocks: PtBlock[] | null | undefined): PtBlock[] {
  if (!blocks?.length) return []
  return structuredClone(blocks) as PtBlock[]
}

function convertBlockquotes(blocks: PtBlock[]): {
  next: PtBlock[]
  conversions: number
  samples: QuoteSample[]
} {
  const samples: QuoteSample[] = []
  let conversions = 0
  const next = blocks.map((block) => {
    if (block._type !== 'block' || block.style !== 'blockquote') {
      return block
    }
    const text = getPortableTextBlockPlainText(block).trim()
    const key =
      typeof block._key === 'string' && block._key ? block._key : newKey()
    conversions += 1
    samples.push({
      key,
      text: text.slice(0, 160) + (text.length > 160 ? '…' : ''),
    })
    return {
      _type: 'pullQuote',
      _key: key,
      text,
    } satisfies PtBlock
  })
  return {next, conversions, samples}
}

function getReadClient() {
  return createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: SANITY.token || undefined,
    useCdn: false,
  })
}

async function main() {
  const client = APPLY ? getWriteClient() : getReadClient()

  const rows = await client.fetch<BlogRow[]>(
    `*[_type == "blogPost" && !defined(trash.trashedAt)] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      body,
      bodyZh,
      "hasRedesignBody": defined(redesignBody),
      "hasRedesignBodyZh": defined(redesignBodyZh)
    }`,
  )

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Dataset: ${SANITY.dataset}`)
  console.log(`Posts fetched: ${rows.length} (expected ${EXPECTED_POST_COUNT})\n`)

  if (rows.length !== EXPECTED_POST_COUNT) {
    console.error(
      `Post count drift: got ${rows.length}, expected ${EXPECTED_POST_COUNT}.`,
    )
    if (APPLY) {
      console.error('Refusing --apply.')
      process.exit(1)
    }
  }

  const reports: DocReport[] = []
  let totalConversions = 0
  const drift: string[] = []

  for (const row of rows) {
    const slug = row.slug ?? '(no-slug)'
    const title = row.title ?? '(untitled)'
    const enCopy = deepCopyBlocks(row.body)
    const zhCopy = deepCopyBlocks(row.bodyZh)
    const en = convertBlockquotes(enCopy)
    const zh = convertBlockquotes(zhCopy)
    totalConversions += en.conversions + zh.conversions

    const expected = EXPECTED_BY_SLUG.get(slug)
    if (expected) {
      if (en.conversions !== expected.en || zh.conversions !== expected.zh) {
        drift.push(
          `${slug}: expected EN ${expected.en} / ZH ${expected.zh}, got EN ${en.conversions} / ZH ${zh.conversions}`,
        )
      }
    } else if (en.conversions !== 0 || zh.conversions !== 0) {
      drift.push(
        `${slug}: expected 0 conversions, got EN ${en.conversions} / ZH ${zh.conversions}`,
      )
    }

    reports.push({
      id: row._id,
      title,
      slug,
      enConversions: en.conversions,
      zhConversions: zh.conversions,
      enSamples: en.samples,
      zhSamples: zh.samples,
      redesignBody: en.next,
      redesignBodyZh: zh.next,
      alreadyHasRedesign: Boolean(row.hasRedesignBody || row.hasRedesignBodyZh),
    })
  }

  for (const report of reports) {
    const flag =
      report.enConversions + report.zhConversions > 0 ? ' ★' : ''
    console.log('─'.repeat(72))
    console.log(`${report.title}${flag}`)
    console.log(`  slug: ${report.slug}`)
    console.log(`  _id:  ${report.id}`)
    console.log(
      `  conversions: EN ${report.enConversions} + ZH ${report.zhConversions} = ${report.enConversions + report.zhConversions}`,
    )
    if (report.alreadyHasRedesign) {
      console.log('  note: redesignBody* already defined — --apply would overwrite')
    }
    if (report.enSamples.length) {
      console.log('  EN samples:')
      for (const sample of report.enSamples) {
        console.log(`    [${sample.key}] ${sample.text}`)
      }
    }
    if (report.zhSamples.length) {
      console.log('  ZH samples:')
      for (const sample of report.zhSamples) {
        console.log(`    [${sample.key}] ${sample.text}`)
      }
    }
  }

  console.log('\n' + '═'.repeat(72))
  console.log(
    `Total conversions: ${totalConversions} (expected ${EXPECTED_TOTAL_CONVERSIONS})`,
  )
  console.log(
    `Docs with quotes: ${reports.filter((r) => r.enConversions + r.zhConversions > 0).length}`,
  )

  if (drift.length) {
    console.error('\nQuote-count drift:')
    for (const line of drift) console.error(`  • ${line}`)
  }

  if (totalConversions !== EXPECTED_TOTAL_CONVERSIONS || drift.length) {
    if (APPLY) {
      console.error('\nRefusing --apply due to count drift.')
      process.exit(1)
    }
    console.error('\nDry-run shows drift — review before any --apply.')
  }

  if (!APPLY) {
    console.log(
      '\nDry-run only. No writes. Re-run with --apply after backup + Zach go-ahead.',
    )
    console.log(
      'Backup: npx sanity dataset export production <path>/vantage-production-$(date +%Y%m%d).tar.gz --no-assets',
    )
    return
  }

  let patched = 0
  for (const report of reports) {
    await client
      .patch(report.id)
      .set({
        redesignBody: report.redesignBody,
        redesignBodyZh: report.redesignBodyZh,
      })
      .commit()
    patched += 1
    console.log(
      `PATCHED ${report.slug} (EN ${report.enConversions}, ZH ${report.zhConversions})`,
    )
  }

  console.log(`\nApplied. Patched ${patched} docs. body/bodyZh untouched.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
