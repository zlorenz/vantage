/**
 * Unset document fields removed from the Studio schema so "Unknown fields found"
 * warnings disappear.
 *
 * Targets:
 *   - page.brandLogos, page.heroSlides (replaced by carouselSlides; logos removed)
 *   - page.showHeroHeader, page.heroTitle, page.heroTitleZh (hardcoded in Next)
 *   - portfolioEntry.clients, crewMembers, platforms (creditIdentity / D10)
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/unset-retired-schema-fields.ts
 *   npx tsx scripts/migration/patch/unset-retired-schema-fields.ts --apply
 */

import {getWriteClient} from '../lib/sanity-client'
import '../config'

const APPLY = process.argv.includes('--apply')

const PAGE_FIELDS = [
  'brandLogos',
  'heroSlides',
  'showHeroHeader',
  'heroTitle',
  'heroTitleZh',
] as const
const PORTFOLIO_FIELDS = ['clients', 'crewMembers', 'platforms'] as const

async function main() {
  const client = getWriteClient()

  const pages = await client.fetch<
    Array<{_id: string; slug?: string; fields: string[]}>
  >(
    `*[_type == "page" && (
      defined(brandLogos) || defined(heroSlides) ||
      defined(showHeroHeader) || defined(heroTitle) || defined(heroTitleZh)
    )]{
      _id,
      "slug": slug.current,
      "fields": [
        select(defined(brandLogos) => "brandLogos"),
        select(defined(heroSlides) => "heroSlides"),
        select(defined(showHeroHeader) => "showHeroHeader"),
        select(defined(heroTitle) => "heroTitle"),
        select(defined(heroTitleZh) => "heroTitleZh")
      ]
    }`,
  )

  const portfolios = await client.fetch<
    Array<{_id: string; title?: string; fields: string[]}>
  >(
    `*[_type == "portfolioEntry" && (
      defined(clients) || defined(crewMembers) || defined(platforms)
    )]{
      _id,
      title,
      "fields": [
        select(defined(clients) => "clients"),
        select(defined(crewMembers) => "crewMembers"),
        select(defined(platforms) => "platforms")
      ]
    }`,
  )

  const pageRows = pages.map((doc) => ({
    ...doc,
    fields: doc.fields.filter(Boolean),
  }))
  const portfolioRows = portfolios.map((doc) => ({
    ...doc,
    fields: doc.fields.filter(Boolean),
  }))

  console.log(
    `${APPLY ? 'APPLY' : 'DRY-RUN'}: unset retired fields on ${pageRows.length} page(s), ${portfolioRows.length} portfolio entr(ies)`,
  )

  let patched = 0

  for (const doc of pageRows) {
    const fields = doc.fields.filter((f): f is (typeof PAGE_FIELDS)[number] =>
      (PAGE_FIELDS as readonly string[]).includes(f),
    )
    console.log(
      `  ${APPLY ? 'UNSET' : 'WOULD UNSET'} page ${doc.slug ?? doc._id} — ${fields.join(', ')}`,
    )
    if (APPLY && fields.length) {
      await client.patch(doc._id).unset([...fields]).commit({returnDocuments: false})
      patched += 1
    }
  }

  for (const doc of portfolioRows) {
    const fields = doc.fields.filter(
      (f): f is (typeof PORTFOLIO_FIELDS)[number] =>
        (PORTFOLIO_FIELDS as readonly string[]).includes(f),
    )
    if (APPLY && fields.length) {
      await client.patch(doc._id).unset([...fields]).commit({returnDocuments: false})
      patched += 1
    }
  }

  if (portfolioRows.length) {
    console.log(
      `  ${APPLY ? 'UNSET' : 'WOULD UNSET'} clients/crewMembers/platforms on ${portfolioRows.length} portfolio entr(ies)`,
    )
  }

  if (APPLY) {
    console.log(`Patched ${patched} document(s)`)
  } else {
    console.log('Pass --apply to write changes.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
