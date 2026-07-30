/**
 * Backfill stale portfolioEntry.titleZh for the 11 docs saved under the old
 * asymmetric ZH part fallback (product/campaign/hero dropped instead of EN).
 *
 * Allowlist-only — never expands beyond SLUGS below.
 *
 * Dry-run (default):
 *   npx tsx scripts/migration/patch/backfill-stale-title-zh.ts
 *
 * Apply (after review):
 *   npx tsx scripts/migration/patch/backfill-stale-title-zh.ts --apply
 *
 * --apply requires SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) in .env.local.
 * Patches only titleZh on the allowlisted documents.
 */

import {createClient} from '@sanity/client'

import {resolveDisplayTitles} from '@display-titles'

import {SANITY} from '../config'
import {getWriteClient} from '../lib/sanity-client'

/** Exact set from the stale-titleZh audit — do not expand. */
const SLUGS = [
  'mavic-travel-tips',
  'mavic-mini',
  'oppo-reno-6-pro-5g',
  'samsung-galaxy-s21',
  'dji-meet-osmo-pocket',
  'dji-meet-spark',
  'dji-matrice-200-series-search-rescue-in-extreme-environments',
  'roborock-s7-maxv-ultra-everything-made-easy',
  'roborock-qrevo-s-essential-power-ultimate-convenience',
  'valerion-visionmaster-max-hollywood-grade-home-cinema-experience',
  'msi-120hz-perfectedge-monitor',
] as const

const APPLY = process.argv.includes('--apply')

type PortfolioDoc = {
  _id: string
  slug: string
  titleZh?: string
  displayTitleParts?: {
    brandName?: string
    productName?: string
    campaignTitle?: string
    brandNameZh?: string
    productNameZh?: string
    campaignTitleZh?: string
  }
  heroFilmTitle?: string
  heroFilmTitleZh?: string
}

type Row = {
  _id: string
  slug: string
  currentTitleZh: string
  nextTitleZh: string
  changed: boolean
}

function getReadClient() {
  const token =
    process.env.SANITY_API_READ_TOKEN ||
    process.env.SANITY_API_WRITE_TOKEN ||
    process.env.SANITY_API_TOKEN ||
    SANITY.token ||
    ''
  return createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: token || undefined,
    useCdn: false,
  })
}

function computeTitleZh(doc: PortfolioDoc): string {
  const parts = doc.displayTitleParts ?? {}
  return resolveDisplayTitles(
    {
      brandName: parts.brandName,
      productName: parts.productName,
      campaignTitle: parts.campaignTitle,
      heroFilmTitle: doc.heroFilmTitle,
      brandNameZh: parts.brandNameZh,
      productNameZh: parts.productNameZh,
      campaignTitleZh: parts.campaignTitleZh,
      heroFilmTitleZh: doc.heroFilmTitleZh,
    },
    'zh',
  )
    .documentTitle.replace(/\s+/g, ' ')
    .trim()
}

function printTable(rows: Row[]) {
  const headers = ['slug', 'current titleZh', 'newly computed titleZh'] as const
  const cells = rows.map((row) => [
    row.slug,
    row.currentTitleZh || '(empty)',
    row.nextTitleZh || '(empty)',
  ])
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...cells.map((c) => c[i].length)),
  )
  const line = (cols: string[]) =>
    cols.map((c, i) => c.padEnd(widths[i])).join('  |  ')
  console.log(line([...headers]))
  console.log(widths.map((w) => '-'.repeat(w)).join('--+--'))
  for (const row of cells) console.log(line(row))
}

async function main() {
  const allow = new Set<string>(SLUGS)
  if (allow.size !== SLUGS.length) {
    throw new Error('SLUGS allowlist has duplicates — aborting')
  }

  const client = APPLY ? getWriteClient() : getReadClient()

  const docs = await client.fetch<PortfolioDoc[]>(
    `*[
      _type == "portfolioEntry" &&
      !(_id in path("drafts.**")) &&
      slug.current in $slugs
    ]{
      _id,
      "slug": slug.current,
      titleZh,
      displayTitleParts,
      heroFilmTitle,
      heroFilmTitleZh
    }`,
    {slugs: [...SLUGS]},
  )

  // Refuse anything outside the allowlist (defense in depth).
  const unexpected = docs.filter((d) => !allow.has(d.slug))
  if (unexpected.length) {
    throw new Error(
      `Fetch returned unexpected slug(s): ${unexpected.map((d) => d.slug).join(', ')}`,
    )
  }

  const bySlug = new Map(docs.map((d) => [d.slug, d]))
  const missing = SLUGS.filter((slug) => !bySlug.has(slug))
  if (missing.length) {
    throw new Error(`Allowlisted slug(s) not found: ${missing.join(', ')}`)
  }
  if (docs.length !== SLUGS.length) {
    throw new Error(
      `Expected ${SLUGS.length} docs, got ${docs.length} — aborting (possible duplicate slugs)`,
    )
  }

  const rows: Row[] = SLUGS.map((slug) => {
    const doc = bySlug.get(slug)!
    const currentTitleZh = (doc.titleZh ?? '').replace(/\s+/g, ' ').trim()
    const nextTitleZh = computeTitleZh(doc)
    return {
      _id: doc._id,
      slug,
      currentTitleZh,
      nextTitleZh,
      changed: currentTitleZh !== nextTitleZh,
    }
  })

  printTable(rows)
  console.log('')
  console.log(
    `Allowlist: ${SLUGS.length}  |  changed: ${rows.filter((r) => r.changed).length}  |  unchanged: ${rows.filter((r) => !r.changed).length}`,
  )

  const emptyNext = rows.filter((r) => !r.nextTitleZh)
  if (emptyNext.length) {
    throw new Error(
      `Computed empty titleZh for: ${emptyNext.map((r) => r.slug).join(', ')} — aborting`,
    )
  }

  if (!APPLY) {
    console.log('Dry-run only. Re-run with --apply to patch titleZh.')
    return
  }

  const toPatch = rows.filter((r) => r.changed)
  if (!toPatch.length) {
    console.log('Nothing to patch — all titleZh values already match.')
    return
  }

  // Single transaction; one .patch(id).set({titleZh}) per allowlisted doc.
  let tx = client.transaction()
  for (const row of toPatch) {
    if (!allow.has(row.slug)) {
      throw new Error(`Refusing to patch non-allowlisted slug: ${row.slug}`)
    }
    tx = tx.patch(row._id, (p) => p.set({titleZh: row.nextTitleZh}))
  }
  await tx.commit()

  console.log(`Applied titleZh patches on ${toPatch.length} document(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
