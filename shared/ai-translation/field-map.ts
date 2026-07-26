import type {FieldMapping, TranslateDocumentType} from './types'

const SEO_META: FieldMapping = {
  enPath: 'seo.metaDescription',
  zhPath: 'seo.metaDescriptionZh',
  kind: 'plain',
  label: 'SEO meta description',
  where: 'Document <meta> description',
}

const SLUG: FieldMapping = {
  enPath: 'slug.current',
  zhPath: 'slugZh.current',
  kind: 'slug',
  label: 'URL slug',
  where: 'Public URL path segment',
  slugEmptyOnly: true,
}

export const FIELD_MAPS: Record<TranslateDocumentType, FieldMapping[]> = {
  portfolioEntry: [
    {
      enPath: 'title',
      zhPath: 'titleZh',
      kind: 'plain',
      label: 'Title',
      where: 'Portfolio page / admin title (synced from display parts)',
    },
    SLUG,
    {
      enPath: 'displayTitleParts.brandName',
      zhPath: 'displayTitleParts.brandNameZh',
      kind: 'plain',
      label: 'Brand name',
      where: 'Display title brand',
    },
    {
      enPath: 'displayTitleParts.productName',
      zhPath: 'displayTitleParts.productNameZh',
      kind: 'plain',
      label: 'Product name',
      where: 'Display title product',
    },
    {
      enPath: 'displayTitleParts.campaignTitle',
      zhPath: 'displayTitleParts.campaignTitleZh',
      kind: 'plain',
      label: 'Campaign title',
      where: 'Display title campaign',
    },
    {
      enPath: 'heroFilmTitle',
      zhPath: 'heroFilmTitleZh',
      kind: 'plain',
      label: 'Hero film title',
      where: 'Media tab — first-video episode (Full title only)',
    },
    {
      enPath: 'excerpt',
      zhPath: 'excerptZh',
      kind: 'plain',
      label: 'Excerpt',
      where: 'Carousel / card teaser',
    },
    {
      enPath: 'description',
      zhPath: 'descriptionZh',
      kind: 'plain',
      label: 'Description',
      where: 'Portfolio body copy',
    },
    {
      enPath: 'additionalVideos[].videoTitle',
      zhPath: 'additionalVideos[].videoTitleZh',
      kind: 'plain',
      label: 'Additional video title',
      where: 'Portfolio extra video row — episode title only',
    },
    {
      enPath: 'additionalVideos[].description',
      zhPath: 'additionalVideos[].descriptionZh',
      kind: 'plain',
      label: 'Additional video description',
      where: 'Portfolio extra video row',
    },
    SEO_META,
  ],

  blogPost: [
    {
      enPath: 'title',
      zhPath: 'titleZh',
      kind: 'plain',
      label: 'Title',
      where: 'News card / article H1',
    },
    SLUG,
    {
      enPath: 'excerpt',
      zhPath: 'excerptZh',
      kind: 'plain',
      label: 'Excerpt',
      where: 'News card excerpt',
    },
    {
      enPath: 'body',
      zhPath: 'bodyZh',
      kind: 'portableText',
      label: 'Body',
      where: 'Article body',
    },
    SEO_META,
  ],

  page: [
    {
      enPath: 'title',
      zhPath: 'titleZh',
      kind: 'plain',
      label: 'Title',
      where: 'Page title / metadata',
    },
    {
      enPath: 'excerpt',
      zhPath: 'excerptZh',
      kind: 'plain',
      label: 'Excerpt',
      where: 'Page card / teaser copy',
    },
    SLUG,
    {
      enPath: 'heroTitle',
      zhPath: 'heroTitleZh',
      kind: 'html',
      label: 'Hero title',
      where: 'Page hero heading',
    },
    {
      enPath: 'body',
      zhPath: 'bodyZh',
      kind: 'portableText',
      label: 'Body',
      where: 'Page body',
    },
    {
      enPath: 'founders[].jobTitle',
      zhPath: 'founders[].jobTitleZh',
      kind: 'plain',
      label: 'Founder job title',
      where: 'About page founder card',
    },
    SEO_META,
  ],

  industry: [
    {
      enPath: 'title',
      zhPath: 'titleZh',
      kind: 'plain',
      label: 'Title',
      where: 'Work filter / archive H1',
    },
    SLUG,
    {
      enPath: 'description',
      zhPath: 'descriptionZh',
      kind: 'plain',
      label: 'Description',
      where: 'Industry archive intro',
    },
  ],

  market: [
    {
      enPath: 'title',
      zhPath: 'titleZh',
      kind: 'plain',
      label: 'Title',
      where: 'Work filter / archive H1',
    },
    SLUG,
    {
      enPath: 'description',
      zhPath: 'descriptionZh',
      kind: 'plain',
      label: 'Description',
      where: 'Market archive intro',
    },
  ],

  videoFormat: [
    {
      enPath: 'title',
      zhPath: 'titleZh',
      kind: 'plain',
      label: 'Title',
      where: 'Work filter / archive H1',
    },
    SLUG,
    {
      enPath: 'description',
      zhPath: 'descriptionZh',
      kind: 'plain',
      label: 'Description',
      where: 'Video format archive intro',
    },
  ],

  category: [
    {
      enPath: 'title',
      zhPath: 'titleZh',
      kind: 'plain',
      label: 'Title',
      where: 'Blog sidebar / category archive',
    },
    SLUG,
  ],

  siteSettings: [
    {
      enPath: 'contactAddress',
      zhPath: 'contactAddressZh',
      kind: 'plain',
      label: 'Contact address',
      where: 'Contact modal',
    },
    {
      enPath: 'contactModalTitle',
      zhPath: 'contactModalTitleZh',
      kind: 'plain',
      label: 'Contact modal title',
      where: 'Contact modal heading',
    },
    {
      enPath: 'contactModalIntro',
      zhPath: 'contactModalIntroZh',
      kind: 'plain',
      label: 'Contact modal intro',
      where: 'Contact modal intro',
    },
    {
      enPath: 'contactModalContent',
      zhPath: 'contactModalContentZh',
      kind: 'portableText',
      label: 'Contact modal content',
      where: 'Contact modal body',
    },
    {
      enPath: 'contactCtaText',
      zhPath: 'contactCtaTextZh',
      kind: 'plain',
      label: 'Contact CTA text',
      where: 'Contact modal CTA',
    },
  ],
}

/** Document types with bilingual CMS fields shown on the Translations dashboard. */
export const CONVERTIBLE_TYPES = Object.keys(FIELD_MAPS) as TranslateDocumentType[]

export function isConvertibleType(type: string): type is TranslateDocumentType {
  return type in FIELD_MAPS
}

export function mappingsFor(type: TranslateDocumentType): FieldMapping[] {
  return FIELD_MAPS[type] ?? []
}

/** Pages excluded from the public Translations dashboard (internal-only / code-owned). */
export function isExcludedPageSlug(slug: string | undefined | null): boolean {
  return slug === 'work-internal'
}
