/**
 * Backfill blogPost.redesignBody / redesignBodyZh from live body / bodyZh.
 *
 * Copies each portable-text array, then **only inside the redesign copies**:
 *  1. Convert blockquote-style blocks → pullQuote objects.
 *  2. Strip the first videoEmbed that matches the hero film URL
 *     (relatedCase main video, else mainVideo.url) — same resolution as
 *     BlogPostHeroMedia / page.tsx resolveBlogHeroVideoUrl; match via
 *     shared urlsMatch (Studio resolveVideoTitle).
 *
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
import {
  resolveMainPortfolioVideo,
  type PortfolioVideoSource,
} from '../../../shared/portfolio-videos'
import {
  getPortableTextBlockPlainText,
  urlsMatch,
} from '../../../shared/video-url'
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
  url?: string
  children?: unknown
}

type RelatedCaseRow = PortfolioVideoSource & {
  _id?: string
}

type BlogRow = {
  _id: string
  title?: string | null
  slug?: string | null
  body?: PtBlock[] | null
  bodyZh?: PtBlock[] | null
  mainVideo?: {url?: string | null} | null
  relatedCase?: RelatedCaseRow | null
  hasRedesignBody?: boolean
  hasRedesignBodyZh?: boolean
}

type QuoteSample = {key: string; text: string}

type VideoStripResult = {
  stripped: boolean
  /** Hero URL used for matching; null when no relatedCase/mainVideo. */
  heroUrl: string | null
  /** Why strip was skipped when not stripped. */
  skipReason?: 'no-hero' | 'no-matching-embed'
  matchedUrl?: string
  blockIndex?: number
  blockKey?: string
  remainingVideoEmbeds: number
}

type DocReport = {
  id: string
  title: string
  slug: string
  enConversions: number
  zhConversions: number
  enSamples: QuoteSample[]
  zhSamples: QuoteSample[]
  enVideo: VideoStripResult
  zhVideo: VideoStripResult
  redesignBody: PtBlock[]
  redesignBodyZh: PtBlock[]
  alreadyHasRedesign: boolean
  /** Hero linked but body still has embeds — ok after strip, or no match. */
  hasHeroLink: boolean
  /** No hero link yet; embeds left in place — re-run after Studio linking. */
  needsRerunAfterLink: boolean
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

/**
 * Same source as page.tsx resolveBlogHeroVideoUrl /
 * BlogPostHeroMedia relatedCase path.
 */
function resolveHeroVideoUrl(row: BlogRow): string | undefined {
  if (row.relatedCase?._id) {
    const main = resolveMainPortfolioVideo(row.relatedCase)
    const url =
      main?.vimeoUrl?.trim() || row.relatedCase.vimeoUrl?.trim() || ''
    return url || undefined
  }
  const mainUrl = row.mainVideo?.url?.trim()
  return mainUrl || undefined
}

function countVideoEmbeds(blocks: PtBlock[]): number {
  return blocks.filter((b) => b._type === 'videoEmbed').length
}

/** Splice out the first videoEmbed whose url matches heroUrl (urlsMatch). */
function stripFirstMatchingVideoEmbed(
  blocks: PtBlock[],
  heroUrl: string | null,
): {next: PtBlock[]; result: VideoStripResult} {
  const remainingBefore = countVideoEmbeds(blocks)

  if (!heroUrl) {
    return {
      next: blocks,
      result: {
        stripped: false,
        heroUrl: null,
        skipReason: 'no-hero',
        remainingVideoEmbeds: remainingBefore,
      },
    }
  }

  const index = blocks.findIndex((block) => {
    if (block._type !== 'videoEmbed') return false
    const url = typeof block.url === 'string' ? block.url.trim() : ''
    return Boolean(url && urlsMatch(url, heroUrl))
  })

  if (index < 0) {
    return {
      next: blocks,
      result: {
        stripped: false,
        heroUrl,
        skipReason: 'no-matching-embed',
        remainingVideoEmbeds: remainingBefore,
      },
    }
  }

  const matched = blocks[index]!
  const matchedUrl =
    typeof matched.url === 'string' ? matched.url.trim() : ''
  const next = [...blocks.slice(0, index), ...blocks.slice(index + 1)]

  return {
    next,
    result: {
      stripped: true,
      heroUrl,
      matchedUrl,
      blockIndex: index,
      blockKey: typeof matched._key === 'string' ? matched._key : undefined,
      remainingVideoEmbeds: countVideoEmbeds(next),
    },
  }
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

function formatVideoStrip(label: string, v: VideoStripResult): void {
  if (v.stripped) {
    console.log(
      `  video strip ${label}: YES — index ${v.blockIndex}` +
        (v.blockKey ? ` key=${v.blockKey}` : '') +
        ` matched=${v.matchedUrl} (hero=${v.heroUrl}); remaining embeds=${v.remainingVideoEmbeds}`,
    )
    return
  }
  if (v.skipReason === 'no-hero') {
    console.log(
      `  video strip ${label}: NO — no relatedCase/mainVideo (embeds kept=${v.remainingVideoEmbeds})`,
    )
    return
  }
  console.log(
    `  video strip ${label}: NO — hero set (${v.heroUrl}) but no matching videoEmbed (embeds=${v.remainingVideoEmbeds})`,
  )
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
      mainVideo{ url },
      relatedCase->{
        _id,
        videos[]{
          _key,
          vimeoUrl,
          xinpianchangUrl,
          videoTitle,
          videoTitleZh,
          previewCleanVimeoUrl,
          previewStartSeconds,
          previewEndSeconds
        },
        vimeoUrl,
        xinpianchangUrl,
        previewCleanVimeoUrl,
        previewStartSeconds,
        previewEndSeconds,
        heroFilmTitle,
        heroFilmTitleZh,
        additionalVideos[]{
          _key,
          vimeoUrl,
          xinpianchangUrl,
          videoTitle,
          videoTitleZh
        }
      },
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
    const heroUrl = resolveHeroVideoUrl(row) ?? null
    const hasHeroLink = Boolean(heroUrl)

    const enQuotes = convertBlockquotes(deepCopyBlocks(row.body))
    const zhQuotes = convertBlockquotes(deepCopyBlocks(row.bodyZh))
    totalConversions += enQuotes.conversions + zhQuotes.conversions

    const enStrip = stripFirstMatchingVideoEmbed(enQuotes.next, heroUrl)
    const zhStrip = stripFirstMatchingVideoEmbed(zhQuotes.next, heroUrl)

    const expected = EXPECTED_BY_SLUG.get(slug)
    if (expected) {
      if (
        enQuotes.conversions !== expected.en ||
        zhQuotes.conversions !== expected.zh
      ) {
        drift.push(
          `${slug}: expected EN ${expected.en} / ZH ${expected.zh}, got EN ${enQuotes.conversions} / ZH ${zhQuotes.conversions}`,
        )
      }
    } else if (enQuotes.conversions !== 0 || zhQuotes.conversions !== 0) {
      drift.push(
        `${slug}: expected 0 conversions, got EN ${enQuotes.conversions} / ZH ${zhQuotes.conversions}`,
      )
    }

    const embedsLeftWithoutHero =
      !hasHeroLink &&
      (enStrip.result.remainingVideoEmbeds > 0 ||
        zhStrip.result.remainingVideoEmbeds > 0)

    reports.push({
      id: row._id,
      title,
      slug,
      enConversions: enQuotes.conversions,
      zhConversions: zhQuotes.conversions,
      enSamples: enQuotes.samples,
      zhSamples: zhQuotes.samples,
      enVideo: enStrip.result,
      zhVideo: zhStrip.result,
      redesignBody: enStrip.next,
      redesignBodyZh: zhStrip.next,
      alreadyHasRedesign: Boolean(row.hasRedesignBody || row.hasRedesignBodyZh),
      hasHeroLink,
      needsRerunAfterLink: embedsLeftWithoutHero,
    })
  }

  for (const report of reports) {
    const flag =
      report.enConversions + report.zhConversions > 0 ||
      report.enVideo.stripped ||
      report.zhVideo.stripped
        ? ' ★'
        : ''
    console.log('─'.repeat(72))
    console.log(`${report.title}${flag}`)
    console.log(`  slug: ${report.slug}`)
    console.log(`  _id:  ${report.id}`)
    console.log(
      `  conversions: EN ${report.enConversions} + ZH ${report.zhConversions} = ${report.enConversions + report.zhConversions}`,
    )
    formatVideoStrip('EN', report.enVideo)
    formatVideoStrip('ZH', report.zhVideo)
    if (report.needsRerunAfterLink) {
      console.log(
        '  FLAG: no relatedCase/mainVideo yet but body still has videoEmbed(s) — re-run this backfill after Studio linking so the hero duplicate can be stripped.',
      )
    }
    if (report.alreadyHasRedesign) {
      console.log(
        '  note: redesignBody* already defined — --apply would overwrite',
      )
    }
    if (report.enSamples.length) {
      console.log('  EN quote samples:')
      for (const sample of report.enSamples) {
        console.log(`    [${sample.key}] ${sample.text}`)
      }
    }
    if (report.zhSamples.length) {
      console.log('  ZH quote samples:')
      for (const sample of report.zhSamples) {
        console.log(`    [${sample.key}] ${sample.text}`)
      }
    }
  }

  const strippedEn = reports.filter((r) => r.enVideo.stripped).length
  const strippedZh = reports.filter((r) => r.zhVideo.stripped).length
  const needsRerun = reports.filter((r) => r.needsRerunAfterLink)

  console.log('\n' + '═'.repeat(72))
  console.log(
    `Total conversions: ${totalConversions} (expected ${EXPECTED_TOTAL_CONVERSIONS})`,
  )
  console.log(
    `Docs with quotes: ${reports.filter((r) => r.enConversions + r.zhConversions > 0).length}`,
  )
  console.log(
    `Video strips: EN ${strippedEn} docs, ZH ${strippedZh} docs`,
  )
  console.log(
    `Needs re-run after relatedCase/mainVideo link: ${needsRerun.length} docs`,
  )
  for (const r of needsRerun) {
    console.log(
      `  • ${r.slug} (EN embeds=${r.enVideo.remainingVideoEmbeds}, ZH embeds=${r.zhVideo.remainingVideoEmbeds})`,
    )
  }

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
    console.log(
      'Phase 5 (remove suppressVideoUrl render logic): HELD until apply + query/render swap verified.',
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
      `PATCHED ${report.slug} (quotes EN ${report.enConversions}/ZH ${report.zhConversions}; video strip EN ${report.enVideo.stripped}/ZH ${report.zhVideo.stripped})`,
    )
  }

  console.log(`\nApplied. Patched ${patched} docs. body/bodyZh untouched.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
