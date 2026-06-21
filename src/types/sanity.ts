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
  contactModalTitle?: string;
  contactModalContent?: PortableTextBlock[];
  socialVimeo?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialLinkedin?: string;
  socialYoutube?: string;
  socialXinpianchang?: string;
  socialXiaohongshu?: string;
  defaultOgImage?: SanityImage;
}

/** Minimal page shape for navigation slug resolution. */
export interface NavPage {
  slug: string;
  slugZh?: string;
}

/** SEO fields object on portfolioEntry (and pages/posts). */
export interface SeoFields {
  metaDescription?: string;
  metaDescriptionZh?: string;
  focusKeyword?: string;
}

/** Minimal card shape — PortfolioCard component. */
export interface PortfolioCard {
  _id: string;
  slug: string;
  slugZh?: string;
  thumbTitle: string;
  featuredImage: SanityImage;
  isHidden?: boolean;
}

/** Card + filter metadata for PortfolioGrid (public filters). */
export interface PortfolioGridEntry extends PortfolioCard {
  videoFormatSlugs?: string[];
  industrySlugs?: string[];
  marketSlugs?: string[];
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

export interface CreditsAdditionalRow {
  role?: string;
  names?: string;
}

/** Credits department — field keys match Sanity schema (prod_brand, cam_dop, etc.). */
export type CreditsDepartment = Record<
  string,
  string | CreditsAdditionalRow[] | undefined
>;

export interface PortfolioCredits {
  production?: CreditsDepartment;
  camera?: CreditsDepartment;
  ge?: CreditsDepartment;
  art?: CreditsDepartment;
  casting?: CreditsDepartment;
  stills?: CreditsDepartment;
  post?: CreditsDepartment;
}

export interface AdditionalVideo {
  vimeoUrl: string;
  xinpianchangUrl?: string;
  longTitle: string;
  description?: string;
}

/** Full single-entry shape — PORTFOLIO_ENTRY_QUERY. */
export interface PortfolioEntry {
  _id: string;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  thumbTitle: string;
  headerTitle: string;
  longTitle: string;
  description: string;
  descriptionZh?: string;
  featuredImage: SanityImage;
  vimeoUrl: string;
  xinpianchangUrl?: string;
  isHidden?: boolean;
  additionalVideos?: AdditionalVideo[];
  credits?: PortfolioCredits;
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
}

/** Client term for work-internal filters. */
export interface ClientTerm {
  _id: string;
  name: string;
  slug: string;
}

/** Crew member term for work-internal filters. */
export interface CrewMemberTerm {
  _id: string;
  name: string;
  slug: string;
  role: 'director' | 'dop' | 'art-director';
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
