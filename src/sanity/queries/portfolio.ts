/**
 * Portfolio GROQ queries — Work index, single entries, taxonomy archives, work-internal.
 *
 * Public list queries exclude isHidden entries. Internal query includes all 141.
 * Taxonomy archive filtering resolves the term document first (by EN or ZH slug),
 * then filters portfolio entries by term _id via references($termId).
 */

/** Fields needed by PortfolioCard and client-side grid filtering. */
const PORTFOLIO_CARD_FIELDS = `
  _id,
  "slug": slug.current,
  "slugZh": slugZh.current,
  thumbTitle,
  featuredImage,
  isHidden
`;

/** Taxonomy slug arrays for public filter bar (format / industry / market). */
const PORTFOLIO_FILTER_FIELDS = `
  "videoFormatSlugs": videoFormats[]->slug.current,
  "industrySlugs": industries[]->slug.current,
  "marketSlugs": markets[]->slug.current
`;

/** Crew/client slug data for work-internal AND-logic filters. */
const PORTFOLIO_INTERNAL_FILTER_FIELDS = `
  "clientSlugs": clients[]->slug.current,
  "crewMembers": crewMembers[]->{
    "slug": slug.current,
    role
  }
`;

/** Full credits object — stored inline on portfolioEntry (all 7 departments). */
const PORTFOLIO_CREDITS_FIELDS = `
  credits{
    production,
    camera,
    ge,
    art,
    casting,
    stills,
    post
  }
`;

/** Public taxonomy term shape for filter dropdowns and archive heroes. */
const TAXONOMY_TERM_FIELDS = `
  _id,
  title,
  titleZh,
  "slug": slug.current,
  "slugZh": slugZh.current
`;

/**
 * All published portfolio entries for the Work index and client-side grid filtering.
 * Excludes isHidden. Includes taxonomy slug arrays for URL-synced filter bar.
 */
export const ALL_PORTFOLIO_QUERY = `
  *[_type == "portfolioEntry" && !isHidden] | order(publishedAt desc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_FILTER_FIELDS}
  }
`;

/**
 * Single portfolio entry by slug (English slug or explicit slugZh on Chinese routes).
 */
export const PORTFOLIO_ENTRY_QUERY = `
  *[_type == "portfolioEntry" && (
    slug.current == $slug || slugZh.current == $slug
  )][0]{
    _id,
    title,
    titleZh,
    "slug": slug.current,
    "slugZh": slugZh.current,
    thumbTitle,
    headerTitle,
    longTitle,
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
      longTitle,
      description
    },
    ${PORTFOLIO_CREDITS_FIELDS},
    seo{
      metaDescription,
      metaDescriptionZh,
      focusKeyword
    }
  }
`;

/**
 * All portfolio slugs for generateStaticParams (141 entries × 2 locales).
 */
export const PORTFOLIO_SLUGS_QUERY = `
  *[_type == "portfolioEntry"] | order(title asc) {
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;

/**
 * All portfolio entries for work-internal — includes isHidden entries.
 */
export const ALL_PORTFOLIO_INTERNAL_QUERY = `
  *[_type == "portfolioEntry"] | order(publishedAt desc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_INTERNAL_FILTER_FIELDS}
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
  *[_type == "portfolioEntry" && !isHidden && references($termId)] | order(publishedAt desc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_FILTER_FIELDS}
  }
`;

/**
 * Portfolio entries linked to an industry term — filter by resolved term _id.
 */
export const PORTFOLIO_BY_INDUSTRY_QUERY = `
  *[_type == "portfolioEntry" && !isHidden && references($termId)] | order(publishedAt desc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_FILTER_FIELDS}
  }
`;

/**
 * Portfolio entries linked to a market term — filter by resolved term _id.
 */
export const PORTFOLIO_BY_MARKET_QUERY = `
  *[_type == "portfolioEntry" && !isHidden && references($termId)] | order(publishedAt desc) {
    ${PORTFOLIO_CARD_FIELDS},
    ${PORTFOLIO_FILTER_FIELDS}
  }
`;

/**
 * Featured image from the most recently published portfolio entry in a taxonomy term.
 * Used for taxonomy archive PageHero backgrounds.
 */
export const TAXONOMY_HERO_IMAGE_QUERY = `
  *[_type == "portfolioEntry" && !isHidden && references($termId)]
    | order(publishedAt desc)[0].featuredImage
`;

/**
 * Nine most recent public portfolio entries — homepage "A Bit of Our Work" grid.
 */
export const RECENT_PORTFOLIO_QUERY = `
  *[_type == "portfolioEntry" && !isHidden] | order(publishedAt desc)[0...9] {
    ${PORTFOLIO_CARD_FIELDS}
  }
`;

/** All clients for work-internal Client filter dropdown. */
export const ALL_CLIENTS_QUERY = `
  *[_type == "client"] | order(name asc) {
    _id,
    name,
    "slug": slug.current
  }
`;

/**
 * Crew members for Director / DOP / Art Director filter dropdowns.
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

/** Work page CMS content (hero, intro body). */
export const WORK_PAGE_QUERY = `
  *[_type == "page" && slug.current == "work"][0]{
    title,
    titleZh,
    heroTitle,
    heroTitleZh,
    featuredImage,
    body,
    bodyZh
  }
`;
