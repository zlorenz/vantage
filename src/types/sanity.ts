/**
 * TypeScript types for Sanity document shapes consumed by Next.js components.
 *
 * Keep in sync with sanity/schemas/. All components that receive Sanity data
 * must use these interfaces — never `any`.
 */

/** Sanity image field value (asset reference + optional crop/hotspot). */
export interface SanityImage {
  _type: 'image';
  asset: {
    _type: 'reference';
    _ref: string;
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/** Portable Text block array (minimal typing for modal content). */
export type PortableTextBlock = Record<string, unknown>;

/**
 * Singleton site settings — matches SITE_SETTINGS_QUERY projection.
 * Source: sanity/schemas/siteSettings.ts
 */
export interface SiteSettings {
  contactEmail: string;
  contactPhone?: string;
  legalName?: string;
  foundingDate?: string;
  numberOfEmployees?: {
    minValue?: number;
    maxValue?: number;
  };
  socialVimeo?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialLinkedin?: string;
  socialYoutube?: string;
  socialXinpianchang?: string;
  socialXiaohongshu?: string;
  defaultOgImage?: SanityImage;
}

/** Minimal page shape for navigation labels and slug resolution. */
export interface NavPage {
  slug: string;
  slugZh?: string;
  title: string;
  titleZh?: string;
  navLabel?: string;
  navLabelZh?: string;
}

/** SEO fields object on portfolioEntry (and pages/posts). */
export interface SeoFields {
  metaDescription?: string;
  metaDescriptionZh?: string;
  metaTitle?: string;
  metaTitleZh?: string;
  ogImage?: SanityImage;
}

/** Minimal card shape — PortfolioCard component. */
export interface PortfolioCard {
  _id: string;
  slug: string;
  slugZh?: string;
  displayTitleParts?: DisplayTitlePartsValue;
  thumbTitleOverride?: string;
  thumbTitleOverrideZh?: string;
  featuredImage: SanityImage;
  isHidden?: boolean;
}

export interface DisplayTitlePartsValue {
  brandName?: string;
  productName?: string;
  campaignTitle?: string;
  brandNameZh?: string;
  productNameZh?: string;
  campaignTitleZh?: string;
}

/** Card + filter metadata for PortfolioGrid (public filters). */
export interface PortfolioGridEntry extends PortfolioCard {
  videoFormatSlugs?: string[];
  industrySlugs?: string[];
  marketSlugs?: string[];
  /** Locale titles for desktop /work card brand | format row. */
  videoFormats?: Array<{
    title?: string | null;
    titleZh?: string | null;
  }> | null;
  /** Present on /work index fetch — used to build client-side search haystacks. */
  crewCredits?: CrewCredit[];
}

/** Platform term for work-internal filters. */
export interface PlatformTerm {
  _id: string;
  name: string;
  slug: string;
}

/**
 * Enriched portfolio row for the internal work library.
 * Source: INTERNAL_LIBRARY_QUERY.
 */
export interface PortfolioVideo {
  _key?: string;
  vimeoUrl: string;
  xinpianchangUrl?: string;
  /** Episode title only — composed with campaign Brand/Product/Campaign on the frontend. */
  videoTitle?: string;
  videoTitleZh?: string;
  description?: string;
  descriptionZh?: string;
  previewCleanVimeoUrl?: string;
  previewStartSeconds?: number;
  previewEndSeconds?: number;
}

export interface InternalLibraryEntry {
  _id: string;
  title: string;
  titleZh?: string;
  displayTitleParts?: DisplayTitlePartsValue;
  thumbTitleOverride?: string;
  thumbTitleOverrideZh?: string;
  headerTitleOverride?: string;
  headerTitleOverrideZh?: string;
  longTitleOverride?: string;
  longTitleOverrideZh?: string;
  slug: string;
  slugZh?: string;
  featuredImage: SanityImage;
  isHidden?: boolean;
  publishedAt?: string;
  videos?: PortfolioVideo[];
  videoFormats?: TaxonomyTerm[];
  industries?: TaxonomyTerm[];
  markets?: TaxonomyTerm[];
  crewCredits?: CrewCredit[];
}

/** Structured person/company credit. */
export interface CrewPerson {
  _key?: string;
  name: string;
  url?: string;
  linkTitle?: string;
  /** Opaque creditIdentity document id when linked. */
  identityId?: string;
  /** Resolved display name from creditIdentity (may differ from denormalized name). */
  identityName?: string;
  /** Optional China-market brand name from creditIdentity. */
  identityNameZh?: string;
}

/** Structured crew credit row shared by Studio and the frontend. */
export interface CrewCredit {
  _key?: string;
  department:
    | 'production'
    | 'camera'
    | 'ge'
    | 'art'
    | 'casting'
    | 'stills'
    | 'post';
  roleKey?: string;
  role: string;
  isCustomRole?: boolean;
  people: CrewPerson[];
}

/** Full single-entry shape — PORTFOLIO_ENTRY_QUERY. */
export interface PortfolioEntry {
  _id: string;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  displayTitleParts?: DisplayTitlePartsValue;
  thumbTitleOverride?: string;
  thumbTitleOverrideZh?: string;
  headerTitleOverride?: string;
  headerTitleOverrideZh?: string;
  longTitleOverride?: string;
  longTitleOverrideZh?: string;
  excerpt?: string;
  excerptZh?: string;
  description: string;
  descriptionZh?: string;
  featuredImage: SanityImage;
  publishedAt?: string;
  isHidden?: boolean;
  /** Ordered films — first item is the main film. */
  videos?: PortfolioVideo[];
  videoFormats?: TaxonomyTerm[];
  industries?: TaxonomyTerm[];
  markets?: TaxonomyTerm[];
  crewCredits?: CrewCredit[];
  seo?: SeoFields;
}

/** Slug pair for generateStaticParams. */
export interface PortfolioSlug {
  slug: string;
  slugZh?: string;
}

/** Public taxonomy term — videoFormat, industry, market. */
export interface TaxonomyTerm {
  _id: string;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  /** Archive intro paragraph (English). */
  description?: string;
  /** Archive intro paragraph (Chinese). */
  descriptionZh?: string;
  /** Parent term _id for nested filter dropdowns (subcategories). */
  parentId?: string;
}

/** Client term for work-internal / public filters. */
export interface ClientTerm {
  _id: string;
  name: string;
  slug: string;
}

/** Crew member term for legacy work-internal filters. */
export interface CrewMemberTerm {
  _id: string;
  name: string;
  slug: string;
  role: 'director' | 'dop' | 'art-director' | 'editor';
}

/** Credit identity term for work-internal filter dropdowns (value = opaque _id). */
export interface CreditIdentityTerm {
  _id: string;
  name: string;
}

/** Work page document projection. */
export interface WorkPage {
  title: string;
  titleZh?: string;
  featuredImage?: SanityImage;
  body?: PortableTextBlock[];
  bodyZh?: PortableTextBlock[];
}

/** CMS page document — shared shape for static pages. */
export interface PageDocument {
  _id: string;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  excerpt?: string;
  excerptZh?: string;
  featuredImage?: SanityImage;
  body?: PortableTextBlock[];
  bodyZh?: PortableTextBlock[];
  /** Homepage carousel order (also drives Work featured strip). */
  carouselSlides?: PortfolioCard[];
  /** Curated grid entries (order preserved). VPS: “Shot in Vietnam”. */
  featuredWork?: PortfolioCard[];
  founders?: Founder[];
  seo?: SeoFields;
  noIndex?: boolean;
}

export interface Founder {
  name: string;
  jobTitle: string;
  jobTitleZh?: string;
  professionalTitle?: string;
  professionalTitleZh?: string;
  image: SanityImage;
  bio?: string;
  bioZh?: string;
  sameAs?: string[];
}

/** Blog post card shape for index and archives. */
export interface BlogPostCard {
  _id: string;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  publishedAt?: string;
  _createdAt?: string;
  featuredImage?: SanityImage;
  excerpt?: string;
  excerptZh?: string;
  /** Plain-text body projection for excerpt fallback when excerpt is empty. */
  bodyText?: string;
  bodyTextZh?: string;
  categories?: CategoryTerm[];
}

/** Full blog post shape. */
export interface BlogPostRelatedCase {
  _id: string;
  featuredImage?: SanityImage;
  description?: string;
  descriptionZh?: string;
  displayTitleParts?: DisplayTitlePartsValue;
  videos?: PortfolioVideo[];
}

export interface BlogPostMainVideo {
  url?: string;
  title?: string;
}

/** Full blog post shape. */
export interface BlogPost extends BlogPostCard {
  body?: PortableTextBlock[];
  bodyZh?: PortableTextBlock[];
  _updatedAt?: string;
  seo?: SeoFields;
  noIndex?: boolean;
  relatedCase?: BlogPostRelatedCase | null;
  mainVideo?: BlogPostMainVideo | null;
}

export interface CategoryTerm {
  _id: string;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
}

/** Search result item from SEARCH_QUERY. */
export interface SearchResultItem {
  _id: string;
  _type: 'portfolioEntry' | 'blogPost';
  title: string;
  titleZh?: string;
  displayTitleParts?: DisplayTitlePartsValue;
  slug: string;
  slugZh?: string;
  /** Portfolio original release date, or blog post publish date. */
  publishedAt?: string;
  featuredImage?: SanityImage;
  description?: string;
  descriptionZh?: string;
  excerpt?: string;
  excerptZh?: string;
  /** Plain-text body projection for blog excerpt fallback. */
  bodyText?: string;
  bodyTextZh?: string;
  /** Blog posts only — category pills for Production Log cards. */
  categories?: CategoryTerm[] | null;
}

/** Blog post slug pair for generateStaticParams. */
export interface PostSlug {
  slug: string;
  slugZh?: string;
}
