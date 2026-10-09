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
      enPath: 'videos[].videoTitle',
      zhPath: 'videos[].videoTitleZh',
      kind: 'plain',
      label: 'Video title',
      where: 'Portfolio video row — episode title (first = main film)',
    },
    {
      enPath: 'videos[].description',
      zhPath: 'videos[].descriptionZh',
      kind: 'plain',
      label: 'Video description',
      where: 'Portfolio video row description',
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
      enPath: 'body',
      zhPath: 'bodyZh',
      kind: 'portableText',
      label: 'Body',
      where: 'Page body (Our Company / Our Industry / Awards)',
    },
    {
      enPath: 'founders[].jobTitle',
      zhPath: 'founders[].jobTitleZh',
      kind: 'plain',
      label: 'Founder job title',
      where: 'Our Company leadership card',
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

  siteSettings: [],
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
