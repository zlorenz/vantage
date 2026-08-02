/**
 * Portfolio GROQ queries — Work index, single entries, taxonomy archives, work-internal.
 *
 * Public list queries exclude isHidden entries. Internal query includes all 141.
 * Taxonomy archive filtering resolves the term document first (by EN or ZH slug),
 * then filters portfolio entries by term _id via references($termId).
 */

import {defineQuery} from 'groq'

import {PORTABLE_TEXT_WITH_IMAGE_ASSETS} from './portable-text'

/** Fields needed by PortfolioCard and client-side grid filtering. */
const PORTFOLIO_CARD_FIELDS = `
  _id,
  "slug": slug.current,
  "slugZh": slugZh.current,
  displayTitleParts{
    brandName,
    productName,
    campaignTitle,
    brandNameZh,
    productNameZh,
    campaignTitleZh
  },
  thumbTitleOverride,
  thumbTitleOverrideZh,
  featuredImage,
  isHidden
`;

/** Structured display title fields for single entry / library. */
const PORTFOLIO_DISPLAY_TITLE_FIELDS = `
  displayTitleParts{
    brandName,
    productName,
    campaignTitle,
    brandNameZh,
    productNameZh,
    campaignTitleZh
  },
  heroFilmTitle,
  heroFilmTitleZh,
  thumbTitleOverride,
  thumbTitleOverrideZh,
  headerTitleOverride,
  headerTitleOverrideZh,
  longTitleOverride,
  longTitleOverrideZh
`;

/** Taxonomy slug arrays for public filter bar (format / industry / market).
 * Includes EN + ZH slugs so URL filters work on both locales. */
const PORTFOLIO_FILTER_FIELDS = `
  "videoFormatSlugs": array::compact((videoFormats[]->slug.current) + (videoFormats[]->slugZh.current)),
  "industrySlugs": array::compact((industries[]->slug.current) + (industries[]->slugZh.current)),
  "marketSlugs": array::compact((markets[]->slug.current) + (markets[]->slugZh.current))
`;

/** Crew/client slug data for work-internal AND-logic filters. */
const PORTFOLIO_INTERNAL_FILTER_FIELDS = `
  "clientSlugs": clients[]->slug.current,
  "crewMembers": crewMembers[]->{
    "slug": slug.current,
    role
  }
`;

/** Structured crew credits for portfolio detail and work-internal filters. */
const PORTFOLIO_CREDITS_FIELDS = `
  crewCredits[]{
    _key,
    department,
    roleKey,
    role,
    isCustomRole,
    people[]{
      _key,
      name,
      "url": coalesce(identity->url, url),
      linkTitle,
      "identityId": identity._ref,
      "identityName": identity->name,
      "identityNameZh": identity->nameZh
    }
  }
`;

/** Public taxonomy term shape for filter dropdowns and archive heroes. */
const TAXONOMY_TERM_FIELDS = `
  _id,
  title,
  titleZh,
  "slug": slug.current,
  "slugZh": slugZh.current,
  description,
  descriptionZh,
  "parentId": parent._ref
`;

/**
 * All published portfolio entries for the Work index and client-side grid filtering.
 * Excludes isHidden. Includes taxonomy slug arrays for URL-synced filter bar.
 */
export const ALL_PORTFOLIO_QUERY = `
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt)] | order(publishedAt desc, title asc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_FILTER_FIELDS}
  }
`;

/**
 * Single portfolio entry by slug (English slug or explicit slugZh on Chinese routes).
 */
export const PORTFOLIO_ENTRY_QUERY = defineQuery(`
  *[_type == "portfolioEntry" && !defined(trash.trashedAt) && (
    slug.current == $slug || slugZh.current == $slug
  )][0]{
    _id,
    title,
    titleZh,
    "slug": slug.current,
    "slugZh": slugZh.current,
    ${PORTFOLIO_DISPLAY_TITLE_FIELDS},
    excerpt,
    excerptZh,
    description,
    descriptionZh,
    featuredImage,
    vimeoUrl,
    xinpianchangUrl,
    publishedAt,
    isHidden,
    additionalVideos[]{
      vimeoUrl,
      xinpianchangUrl,
      videoTitle,
      videoTitleZh,
      description,
      descriptionZh
    },
    ${PORTFOLIO_CREDITS_FIELDS},
    seo{
      metaDescription,
      metaDescriptionZh,
      metaTitle,
      metaTitleZh,
      ogImage
    }
  }
`)

/**
 * All portfolio slugs for generateStaticParams (141 entries × 2 locales).
 */
export const PORTFOLIO_SLUGS_QUERY = `
  *[_type == "portfolioEntry" && !defined(trash.trashedAt)] | order(title asc) {
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;

/**
 * All portfolio entries for work-internal — includes isHidden entries.
 * Kept for PortfolioGrid internal filterMode compatibility.
 */
export const ALL_PORTFOLIO_INTERNAL_QUERY = `
  *[_type == "portfolioEntry" && !defined(trash.trashedAt)] | order(publishedAt desc, title asc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_INTERNAL_FILTER_FIELDS}
  }
`;

/**
 * Enriched library rows for the internal work tool — skim meta + detail pane.
 * Includes hidden entries; resolves names (not just slugs) for filters/display.
 */
export const INTERNAL_LIBRARY_QUERY = `
  *[_type == "portfolioEntry" && !defined(trash.trashedAt)] | order(publishedAt desc, title asc) {
    _id,
    title,
    titleZh,
    ${PORTFOLIO_DISPLAY_TITLE_FIELDS},
    "slug": slug.current,
    "slugZh": slugZh.current,
    featuredImage,
    isHidden,
    publishedAt,
    vimeoUrl,
    xinpianchangUrl,
    clients[]->{
      name,
      "slug": slug.current
    },
    crewMembers[]->{
      name,
      "slug": slug.current,
      role
    },
    platforms[]->{
      name,
      "slug": slug.current
    },
    videoFormats[]->{
      title,
      titleZh,
      "slug": slug.current,
      "slugZh": slugZh.current
    },
    industries[]->{
      title,
      titleZh,
      "slug": slug.current,
      "slugZh": slugZh.current
    },
    markets[]->{
      title,
      titleZh,
      "slug": slug.current,
      "slugZh": slugZh.current
    },
    ${PORTFOLIO_CREDITS_FIELDS}
  }
`;

/** Platform terms for work-internal filter dropdown. */
export const ALL_PLATFORMS_QUERY = `
  *[_type == "platform"] | order(name asc) {
    _id,
    name,
    "slug": slug.current
  }
`;

/** Video format terms for public filter dropdowns. */
export const VIDEO_FORMATS_QUERY = `
  *[_type == "videoFormat"] | order(title asc) {
    ${TAXONOMY_TERM_FIELDS}
  }
`;

/** Industry terms for public filter dropdowns. */
export const INDUSTRIES_QUERY = `
  *[_type == "industry"] | order(title asc) {
    ${TAXONOMY_TERM_FIELDS}
  }
`;

/** Market terms for public filter dropdowns. */
export const MARKETS_QUERY = `
  *[_type == "market"] | order(title asc) {
    ${TAXONOMY_TERM_FIELDS}
  }
`;

/**
 * Resolve a video format term by English or Chinese slug.
 * Used before PORTFOLIO_BY_VIDEO_FORMAT_QUERY on archive pages.
 */
export const VIDEO_FORMAT_BY_SLUG_QUERY = `
  *[_type == "videoFormat" && (
    slug.current == $slug || slugZh.current == $slug
  )][0]{
    ${TAXONOMY_TERM_FIELDS}
  }
`;

/**
 * Resolve an industry term by English or Chinese slug.
 */
export const INDUSTRY_BY_SLUG_QUERY = `
  *[_type == "industry" && (
    slug.current == $slug || slugZh.current == $slug
  )][0]{
    ${TAXONOMY_TERM_FIELDS}
  }
`;

/**
 * Resolve a market term by English or Chinese slug.
 */
export const MARKET_BY_SLUG_QUERY = `
  *[_type == "market" && (
    slug.current == $slug || slugZh.current == $slug
  )][0]{
    ${TAXONOMY_TERM_FIELDS}
  }
`;

/**
 * Portfolio entries linked to a video format term — filter by resolved term _id.
 */
export const PORTFOLIO_BY_VIDEO_FORMAT_QUERY = `
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && references($termId)] | order(publishedAt desc, title asc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_FILTER_FIELDS}
  }
`;

/**
 * Portfolio entries linked to an industry term — filter by resolved term _id.
 */
export const PORTFOLIO_BY_INDUSTRY_QUERY = `
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && references($termId)] | order(publishedAt desc, title asc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_FILTER_FIELDS}
  }
`;

/**
 * Portfolio entries linked to a market term — filter by resolved term _id.
 */
export const PORTFOLIO_BY_MARKET_QUERY = `
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && references($termId)] | order(publishedAt desc, title asc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_FILTER_FIELDS}
  }
`;

/**
 * Featured image from the most recently published portfolio entry in a taxonomy term.
 * Used for taxonomy archive PageHero backgrounds.
 */
export const TAXONOMY_HERO_IMAGE_QUERY = `
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && references($termId)]
    | order(publishedAt desc, title asc)[0].featuredImage
`;

/**
 * Nine most recent public portfolio entries — homepage "A Bit of Our Work" grid.
 */
export const RECENT_PORTFOLIO_QUERY = `
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt)] | order(publishedAt desc, title asc)[0...9] {
    ${PORTFOLIO_CARD_FIELDS}
  }
`;

/** All clients for work-internal Client filter dropdown. */
/**
 * Client terms for work-internal filter dropdown (legacy — prefer identities from credits).
 * @deprecated Use credit identities resolved from crewCredits.
 */
export const ALL_CLIENTS_QUERY = `
  *[_type == "client"] | order(name asc) {
    _id,
    name,
    "slug": slug.current
  }
`;

/**
 * Crew members for Director / DOP / Art Director filter dropdowns (legacy).
 * @deprecated Use credit identities resolved from crewCredits.
 * $role: "director" | "dop" | "art-director"
 */
export const CREW_MEMBERS_BY_ROLE_QUERY = `
  *[_type == "crewMember" && role == $role] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    role
  }
`;

/** All credit identities (opaque vendor entities). */
export const ALL_CREDIT_IDENTITIES_QUERY = `
  *[_type == "creditIdentity"] | order(name asc) {
    _id,
    name
  }
`;

/** Work page CMS content (hero, intro body). */
export const WORK_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "work" && !defined(trash.trashedAt)][0]{
    title,
    titleZh,
    heroTitle,
    heroTitleZh,
    featuredImage,
    "body": body${PORTABLE_TEXT_WITH_IMAGE_ASSETS},
    "bodyZh": bodyZh${PORTABLE_TEXT_WITH_IMAGE_ASSETS}
  }
`)
