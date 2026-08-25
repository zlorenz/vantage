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
  contactWhatsapp?: string;
  contactAddress?: string;
  contactAddressZh?: string;
  contactModalTitle?: string;
  contactModalTitleZh?: string;
  contactModalIntro?: string;
  contactModalIntroZh?: string;
  contactModalContent?: PortableTextBlock[];
  contactModalContentZh?: PortableTextBlock[];
  contactCtaText?: string;
  contactCtaTextZh?: string;
  contactCtaUrl?: string;
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
  campaignCta?: CampaignCta;
}

/** Shared Campaign Brief CTA (Site Settings). */
export interface CampaignCta {
  heading?: string;
  headingZh?: string;
  paragraphs?: string[];
  paragraphsZh?: string[];
  buttonLabel?: string;
  buttonLabelZh?: string;
  buttonHref?: string;
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
  /** Present on /work index fetch — used to build client-side search haystacks. */
  crewCredits?: CrewCredit[];
}

/** Card + internal filter metadata for work-internal grid. */
export interface PortfolioInternalGridEntry extends PortfolioCard {
  clientSlugs?: string[];
  crewMembers?: CrewMemberRef[];
}

export interface CrewMemberRef {
  slug: string;
  role: 'director' | 'dop' | 'art-director';
}

/** Named crew member for internal library skim + filters. */
export interface InternalCrewMember {
  name: string;
  slug: string;
  role: 'director' | 'dop' | 'art-director';
}

/** Named client/platform refs for internal library. */
export interface NamedSlugTerm {
  name: string;
  slug: string;
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
export interface InternalLibraryEntry {
  _id: string;
  title: string;
  titleZh?: string;
  displayTitleParts?: DisplayTitlePartsValue;
  heroFilmTitle?: string;
  heroFilmTitleZh?: string;
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
  vimeoUrl: string;
  xinpianchangUrl?: string;
  clients?: NamedSlugTerm[];
  crewMembers?: InternalCrewMember[];
  platforms?: NamedSlugTerm[];
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

export interface AdditionalVideo {
  vimeoUrl: string;
  xinpianchangUrl?: string;
  /** Episode title only — composed with campaign Brand/Product/Campaign on the frontend. */
  videoTitle: string;
  videoTitleZh?: string;
  description?: string;
  descriptionZh?: string;
}

/** Full single-entry shape — PORTFOLIO_ENTRY_QUERY. */
export interface PortfolioEntry {
  _id: string;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  displayTitleParts?: DisplayTitlePartsValue;
  heroFilmTitle?: string;
  heroFilmTitleZh?: string;
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
  vimeoUrl: string;
  xinpianchangUrl?: string;
  previewStartSeconds?: number;
  previewEndSeconds?: number;
  publishedAt?: string;
  isHidden?: boolean;
  additionalVideos?: AdditionalVideo[];
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
  heroTitle?: string;
  heroTitleZh?: string;
  featuredImage?: SanityImage;
  body?: PortableTextBlock[];
  bodyZh?: PortableTextBlock[];
}

/** Homepage hero slide — dereferenced portfolio entry. */
export interface HeroSlideData {
  slug: string;
  slugZh?: string;
  displayTitleParts?: DisplayTitlePartsValue;
  headerTitleOverride?: string;
  headerTitleOverrideZh?: string;
  description?: string;
  descriptionZh?: string;
  featuredImage: SanityImage;
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
  showHeroHeader?: boolean;
  heroTitle?: string;
  heroTitleZh?: string;
  featuredImage?: SanityImage;
  body?: PortableTextBlock[];
  bodyZh?: PortableTextBlock[];
  heroSlides?: HeroSlideData[];
  /** Curated grid entries (order preserved). Home: “A Bit of Our Work”; VPS: “Shot in Vietnam”. */
  featuredWork?: PortfolioCard[];
  /** Homepage brand logo grid (`logoId` from shared registry). */
  brandLogos?: Array<{ logoId?: string }>;
  founders?: Founder[];
  pdfDownload?: PdfDownload;
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

export interface PdfDownload {
  label: string;
  file?: {
    asset?: {
      _id: string;
      url: string;
    };
  };
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
export interface BlogPost extends BlogPostCard {
  body?: PortableTextBlock[];
  bodyZh?: PortableTextBlock[];
  _updatedAt?: string;
  seo?: SeoFields;
  noIndex?: boolean;
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
  _type: 'portfolioEntry' | 'blogPost';
  title: string;
  titleZh?: string;
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
}

/** Blog post slug pair for generateStaticParams. */
export interface PostSlug {
  slug: string;
  slugZh?: string;
}
