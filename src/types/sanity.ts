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
