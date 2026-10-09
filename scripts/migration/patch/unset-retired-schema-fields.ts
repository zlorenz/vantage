/**
 * Unset document fields removed from the Studio schema so "Unknown fields found"
 * warnings disappear.
 *
 * Targets:
 *   - page.brandLogos, page.heroSlides, page.showHeroHeader, page.heroTitle*
 *   - page.body / bodyZh on redesign pages that no longer render body
 *   - siteSettings contact-modal cluster + campaignCta
 *   - portfolioEntry.clients / crewMembers / platforms
 *   - portfolioEntry legacy video dual-read fields
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

/** Redesign pages — body is code-owned; keep body on our-company / our-industry / awards. */
const PAGE_BODY_UNSET_SLUGS = [
  'home',
  'about',
  'contact',
  'vietnam-production-service',
  'news',
  'work',
  'video-campaign-brief',
] as const

const SITE_SETTINGS_FIELDS = [
  'contactWhatsapp',
  'contactAddress',
  'contactAddressZh',
  'contactModalTitle',
  'contactModalTitleZh',
  'contactModalIntro',
  'contactModalIntroZh',
  'contactModalContent',
  'contactModalContentZh',
  'contactCtaText',
  'contactCtaTextZh',
  'contactCtaUrl',
  'campaignCta',
] as const

const PORTFOLIO_FIELDS = [
  'clients',
  'crewMembers',
  'platforms',
  'vimeoUrl',
  'xinpianchangUrl',
  'previewCleanVimeoUrl',
  'previewStartSeconds',
  'previewEndSeconds',
  'heroFilmTitle',
  'heroFilmTitleZh',
  'additionalVideos',
] as const

async function main() {
  const client = getWriteClient()

  const pages = await client.fetch<
    Array<{_id: string; slug?: string; fields: string[]}>
  >(
    `*[_type == "page" && (
      defined(brandLogos) || defined(heroSlides) ||
      defined(showHeroHeader) || defined(heroTitle) || defined(heroTitleZh) ||
      (slug.current in $bodySlugs && (defined(body) || defined(bodyZh)))
    )]{
      _id,
      "slug": slug.current,
      "fields": [
        select(defined(brandLogos) => "brandLogos"),
        select(defined(heroSlides) => "heroSlides"),
        select(defined(showHeroHeader) => "showHeroHeader"),
        select(defined(heroTitle) => "heroTitle"),
        select(defined(heroTitleZh) => "heroTitleZh"),
        select(slug.current in $bodySlugs && defined(body) => "body"),
        select(slug.current in $bodySlugs && defined(bodyZh) => "bodyZh")
      ]
    }`,
    {bodySlugs: PAGE_BODY_UNSET_SLUGS},
  )

  const settings = await client.fetch<{
    _id: string
    fields: string[]
  } | null>(
    `*[_type == "siteSettings"][0]{
      _id,
      "fields": [
        select(defined(contactWhatsapp) => "contactWhatsapp"),
        select(defined(contactAddress) => "contactAddress"),
        select(defined(contactAddressZh) => "contactAddressZh"),
        select(defined(contactModalTitle) => "contactModalTitle"),
        select(defined(contactModalTitleZh) => "contactModalTitleZh"),
        select(defined(contactModalIntro) => "contactModalIntro"),
        select(defined(contactModalIntroZh) => "contactModalIntroZh"),
        select(defined(contactModalContent) => "contactModalContent"),
        select(defined(contactModalContentZh) => "contactModalContentZh"),
        select(defined(contactCtaText) => "contactCtaText"),
        select(defined(contactCtaTextZh) => "contactCtaTextZh"),
        select(defined(contactCtaUrl) => "contactCtaUrl"),
        select(defined(campaignCta) => "campaignCta")
      ]
    }`,
  )

  const portfolios = await client.fetch<
    Array<{_id: string; title?: string; fields: string[]}>
  >(
    `*[_type == "portfolioEntry" && (
      defined(clients) || defined(crewMembers) || defined(platforms) ||
      defined(vimeoUrl) || defined(xinpianchangUrl) ||
      defined(previewCleanVimeoUrl) || defined(previewStartSeconds) ||
      defined(previewEndSeconds) || defined(heroFilmTitle) ||
      defined(heroFilmTitleZh) || defined(additionalVideos)
    )]{
      _id,
      title,
      "fields": [
        select(defined(clients) => "clients"),
        select(defined(crewMembers) => "crewMembers"),
        select(defined(platforms) => "platforms"),
        select(defined(vimeoUrl) => "vimeoUrl"),
        select(defined(xinpianchangUrl) => "xinpianchangUrl"),
        select(defined(previewCleanVimeoUrl) => "previewCleanVimeoUrl"),
        select(defined(previewStartSeconds) => "previewStartSeconds"),
        select(defined(previewEndSeconds) => "previewEndSeconds"),
        select(defined(heroFilmTitle) => "heroFilmTitle"),
        select(defined(heroFilmTitleZh) => "heroFilmTitleZh"),
        select(defined(additionalVideos) => "additionalVideos")
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
  const settingsFields = (settings?.fields ?? []).filter(Boolean)

  console.log(
    `${APPLY ? 'APPLY' : 'DRY-RUN'}: unset retired fields on ${pageRows.length} page(s), ${
      settingsFields.length ? 1 : 0
    } siteSettings, ${portfolioRows.length} portfolio entr(ies)`,
  )

  let patched = 0

  for (const doc of pageRows) {
    const fields = doc.fields.filter(
      (f) =>
        (PAGE_FIELDS as readonly string[]).includes(f) ||
        f === 'body' ||
        f === 'bodyZh',
    )
    console.log(
      `  ${APPLY ? 'UNSET' : 'WOULD UNSET'} page ${doc.slug ?? doc._id} — ${fields.join(', ')}`,
    )
    if (APPLY && fields.length) {
      await client.patch(doc._id).unset([...fields]).commit({returnDocuments: false})
      patched += 1
    }
  }

  if (settings?._id && settingsFields.length) {
    const fields = settingsFields.filter((f): f is (typeof SITE_SETTINGS_FIELDS)[number] =>
      (SITE_SETTINGS_FIELDS as readonly string[]).includes(f),
    )
    console.log(
      `  ${APPLY ? 'UNSET' : 'WOULD UNSET'} siteSettings — ${fields.join(', ')}`,
    )
    if (APPLY && fields.length) {
      await client
        .patch(settings._id)
        .unset([...fields])
        .commit({returnDocuments: false})
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
    console.log(
      `  ${APPLY ? 'UNSET' : 'WOULD UNSET'} portfolio ${doc.title ?? doc._id} — ${fields.join(', ')}`,
    )
  }

  console.log(
    APPLY
      ? `Done. patched=${patched}`
      : `Dry-run complete. Re-run with --apply to write.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
