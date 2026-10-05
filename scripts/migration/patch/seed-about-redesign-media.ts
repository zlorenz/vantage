/**
 * One-off: seed drafts.page-about-redesign media slots from the same
 * portfolio slices the About page used as automatic placeholders.
 *
 * Usage:
 *   npx tsx scripts/migration/patch/seed-about-redesign-media.ts
 *   npx tsx scripts/migration/patch/seed-about-redesign-media.ts --apply
 *
 * Default is dry-run. Pass --apply to write.
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import {getWriteClient} from '../lib/sanity-client'
import '../config'

const DRAFT_ID = 'drafts.page-about-redesign'
const APPLY = process.argv.includes('--apply')

/** Same CDN still the production-log CTA used when no curated media existed. */
const PRODUCTION_LOG_ASSET_HASH = 'b2887f5288c958358c17df2f070e8ef3ece16d49'

const PORTFOLIO_FILTER = `
  _type == "portfolioEntry" &&
  !(_id in path("drafts.**")) &&
  isHidden != true &&
  !defined(trash.trashedAt) &&
  defined(featuredImage)
`

type PortfolioRow = {
  _id: string
  title?: string | null
  slug?: string | null
}

function newKey(): string {
  return Math.random().toString(36).slice(2, 14)
}

function publishedId(id: string): string {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
}

function previewSlot(entry: PortfolioRow) {
  return {
    _type: 'aboutMediaSlot' as const,
    _key: newKey(),
    mediaMode: 'portfolioPreview' as const,
    portfolioEntry: {
      _type: 'reference' as const,
      _ref: publishedId(entry._id),
    },
  }
}

function imageSlot(entry: PortfolioRow) {
  return {
    _type: 'aboutMediaImageSlot' as const,
    _key: newKey(),
    mediaMode: 'portfolio' as const,
    portfolioEntry: {
      _type: 'reference' as const,
      _ref: publishedId(entry._id),
    },
  }
}

function label(entry: PortfolioRow): string {
  return `${entry.slug ?? publishedId(entry._id)} (${entry.title ?? 'untitled'})`
}

async function main() {
  const client = getWriteClient()

  const page = await client.fetch<{_id: string} | null>(
    `*[_id == $id][0]{_id}`,
    {id: DRAFT_ID},
  )
  if (!page) {
    console.error(`Abort: ${DRAFT_ID} not found ù run create-about-redesign-page-draft.ts first`)
    process.exit(1)
  }

  const entries = await client.fetch<PortfolioRow[]>(
    `*[${PORTFOLIO_FILTER}] | order(publishedAt desc) [0..19] {
      _id,
      title,
      "slug": slug.current
    }`,
  )

  if (entries.length < 19) {
    console.error(
      `Abort: need at least 19 portfolio posters with featured images; got ${entries.length}`,
    )
    process.exit(1)
  }

  const specialties = entries.slice(0, 4).map(previewSlot)
  const advantages = entries.slice(4, 8).map(previewSlot)
  const statementMarkers = entries.slice(0, 2).map(imageSlot)
  const statementFilmStrip = entries.slice(8, 18).map(imageSlot)
  const productionServicesCta = previewSlot(entries[18]!)

  const logAsset = await client.fetch<{_id: string} | null>(
    `*[_type == "sanity.imageAsset" && _id match $needle][0]{_id}`,
    {needle: `*${PRODUCTION_LOG_ASSET_HASH}*`},
  )

  let productionLogCta: Record<string, unknown>
  if (logAsset) {
    productionLogCta = {
      _type: 'aboutMediaSlot',
      _key: newKey(),
      mediaMode: 'staticImage',
      image: {
        _type: 'image',
        asset: {_type: 'reference', _ref: logAsset._id},
      },
      alt: 'Production log',
    }
  } else if (entries[19]) {
    console.warn(
      `Warn: production-log CDN asset not found; using portfolio slice [19] instead`,
    )
    productionLogCta = previewSlot(entries[19])
  } else {
    console.error('Abort: no production-log asset and no 20th portfolio poster')
    process.exit(1)
  }

  console.log(`Target: ${DRAFT_ID}`)
  console.log('Specialties [0..3]:')
  for (const entry of entries.slice(0, 4)) console.log(`  ${label(entry)}`)
  console.log('Advantages [4..7]:')
  for (const entry of entries.slice(4, 8)) console.log(`  ${label(entry)}`)
  console.log('Statement markers [0..1]:')
  for (const entry of entries.slice(0, 2)) console.log(`  ${label(entry)}`)
  console.log('Statement film strip [8..17]:')
  for (const entry of entries.slice(8, 18)) console.log(`  ${label(entry)}`)
  console.log(`Production services CTA [18]: ${label(entries[18]!)}`)
  console.log(
    logAsset
      ? `Production log CTA: static asset ${logAsset._id}`
      : `Production log CTA: ${label(entries[19]!)}`,
  )

  if (!APPLY) {
    console.log('\nDry-run only. Re-run with --apply to write.')
    return
  }

  await client
    .patch(DRAFT_ID)
    .set({
      specialties,
      advantages,
      statementMarkers,
      statementFilmStrip,
      productionServicesCta,
      productionLogCta,
    })
    .commit()

  console.log(`\nPatched ${DRAFT_ID} media slots.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
