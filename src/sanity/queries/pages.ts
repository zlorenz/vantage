/**
 * Page GROQ queries — static CMS pages (home, about, news, Vietnam, etc.).
 */

import {defineQuery} from 'groq'

import {PORTABLE_TEXT_WITH_IMAGE_ASSETS} from './portable-text'

/** Fat base used only by HOME_PAGE_QUERY (unchanged). */
const PAGE_BASE_FIELDS = `
  _id,
  title,
  titleZh,
  "slug": slug.current,
  "slugZh": slugZh.current,
  showHeroHeader,
  heroTitle,
  heroTitleZh,
  featuredImage,
  "body": body${PORTABLE_TEXT_WITH_IMAGE_ASSETS},
  "bodyZh": bodyZh${PORTABLE_TEXT_WITH_IMAGE_ASSETS},
  seo{
    metaDescription,
    metaDescriptionZh,
    metaTitle,
    metaTitleZh,
    ogImage
  },
  noIndex
`

/** Card fields for curated featured-work grids (mirrors portfolio card shape). */
const FEATURED_WORK_FIELDS = `
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
`

/** Shared metadata fields for per-route page queries. */
const PAGE_META_FIELDS = `
  title,
  titleZh,
  "slugZh": slugZh.current,
  featuredImage,
  seo{
    metaDescription,
    metaDescriptionZh,
    metaTitle,
    metaTitleZh,
    ogImage
  },
  noIndex
`

/** Shared hero + body fields for content pages. */
const PAGE_CONTENT_FIELDS = `
  heroTitle,
  heroTitleZh,
  "body": body${PORTABLE_TEXT_WITH_IMAGE_ASSETS},
  "bodyZh": bodyZh${PORTABLE_TEXT_WITH_IMAGE_ASSETS}
`

/** Homepage — SEO/meta (carousel slides via HOME_REDESIGN_CAROUSEL_QUERY). */
export const HOME_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "home" && !defined(trash.trashedAt)][0]{
    ${PAGE_BASE_FIELDS}
  }
`)

/** About — meta, hero/body, founders. */
export const ABOUT_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "about" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    ${PAGE_CONTENT_FIELDS},
    founders[]{
      name,
      jobTitle,
      jobTitleZh,
      professionalTitle,
      professionalTitleZh,
      image,
      bio,
      bioZh,
      sameAs
    }
  }
`)

/** About statement inline markers — two recent portfolio featured images. */
export const ABOUT_STATEMENT_MARKERS_QUERY = defineQuery(`
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && defined(featuredImage)]
  | order(publishedAt desc) [0..1] {
    title,
    featuredImage
  }
`)

/**
 * Placeholder portfolio rows for the About tab panels.
 * Preview fields match the homepage carousel so the same clean-clip
 * resolution can run until About Media is curated.
 */
const ABOUT_TAB_PLACEHOLDER_PROJECTION = `
  title,
  featuredImage,
  "videos": videos[0...1]{
    vimeoUrl,
    previewStartSeconds,
    previewEndSeconds,
    previewCleanVimeoUrl
  },
  vimeoUrl,
  previewStartSeconds,
  previewEndSeconds,
  previewCleanVimeoUrl
`

const ABOUT_MEDIA_PORTFOLIO_PROJECTION = `
  title,
  featuredImage,
  "videos": videos[0...1]{
    vimeoUrl,
    previewStartSeconds,
    previewEndSeconds,
    previewCleanVimeoUrl
  },
  vimeoUrl,
  previewStartSeconds,
  previewEndSeconds,
  previewCleanVimeoUrl
`

const ABOUT_MEDIA_PREVIEW_SLOT = `
  mediaMode,
  videoUrl,
  image,
  alt,
  altZh,
  portfolioEntry->{
    ${ABOUT_MEDIA_PORTFOLIO_PROJECTION}
  }
`

const ABOUT_MEDIA_IMAGE_SLOT = `
  mediaMode,
  image,
  alt,
  altZh,
  portfolioEntry->{
    title,
    featuredImage
  }
`

/** Curated About media — page slug `about`. */
export const ABOUT_MEDIA_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "about" && !defined(trash.trashedAt)][0]{
    specialties[]{${ABOUT_MEDIA_PREVIEW_SLOT}},
    advantages[]{${ABOUT_MEDIA_PREVIEW_SLOT}},
    productionServicesCta{${ABOUT_MEDIA_PREVIEW_SLOT}},
    productionLogCta{${ABOUT_MEDIA_PREVIEW_SLOT}},
    statementMarkers[]{${ABOUT_MEDIA_IMAGE_SLOT}},
    statementFilmStrip[]{${ABOUT_MEDIA_IMAGE_SLOT}}
  }
`)

/** About Who We Are panel — four recent portfolio films (placeholder). */
export const ABOUT_WHO_WE_ARE_IMAGES_QUERY = defineQuery(`
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && defined(featuredImage)]
  | order(publishedAt desc) [0..3] {
    ${ABOUT_TAB_PLACEHOLDER_PROJECTION}
  }
`)

/** About Production House panel — next four portfolio films (placeholder). */
export const ABOUT_PRODUCTION_HOUSE_IMAGES_QUERY = defineQuery(`
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && defined(featuredImage)]
  | order(publishedAt desc) [4..7] {
    ${ABOUT_TAB_PLACEHOLDER_PROJECTION}
  }
`)

/**
 * About statement film strips — ten portfolio posters after the tab slices.
 * Inclusive [8..17] is ten items. Same projection as the marker query.
 */
/** One poster after the film-strip slice, for the services feature image. */
export const ABOUT_FEATURE_POSTER_QUERY = defineQuery(`
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && defined(featuredImage)]
  | order(publishedAt desc) [18..18] {
    title,
    featuredImage
  }
`)

export const ABOUT_STATEMENT_FILM_STRIP_QUERY = defineQuery(`
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && defined(featuredImage)]
  | order(publishedAt desc) [8..17] {
    title,
    featuredImage
  }
`)

/** Contact — meta + optional hero/body; real contact fields come from siteSettings. */
export const CONTACT_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "contact" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    ${PAGE_CONTENT_FIELDS}
  }
`)

/** News index — meta + excerpt intro (no Portable Text body). */
export const NEWS_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "news" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    excerpt,
    excerptZh
  }
`)

/** Vietnam Location Guide — meta, body, PDF download. */
export const VIETNAM_LOCATION_GUIDE_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "vietnam-location-guide" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    ${PAGE_CONTENT_FIELDS},
    pdfDownload{
      label,
      file{
        asset->{
          _id,
          url
        }
      }
    }
  }
`)

/** Lean PDF asset for CTAs that download without loading the guide page. */
export const VIETNAM_LOCATION_GUIDE_PDF_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "vietnam-location-guide" && !defined(trash.trashedAt)][0]{
    "pdfUrl": pdfDownload.file.asset->url,
    "pdfLabel": pdfDownload.label
  }
`)

/** Vietnam Production Service — meta, excerpt intro, body, curated featured work. */
export const VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "vietnam-production-service" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    excerpt,
    excerptZh,
    ${PAGE_CONTENT_FIELDS},
    "featuredWork": featuredWork[
      !defined(@->trash.trashedAt) && @->isHidden != true
    ]->{
      ${FEATURED_WORK_FIELDS}
    }
  }
`)

/** Our Industry — meta, body (hub page linking to taxonomy archives; no featuredWork). */
export const OUR_INDUSTRY_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "our-industry" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    ${PAGE_CONTENT_FIELDS}
  }
`)

/** Our Company — meta + body (own doc). Leadership founders are read separately from about. */
export const OUR_COMPANY_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "our-company" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    ${PAGE_CONTENT_FIELDS}
  }
`)

/**
 * Leadership section on Our Company — read-only founders[] from the existing
 * about page. Does not write to about; our-company has no founders field.
 */
export const ABOUT_FOUNDERS_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "about" && !defined(trash.trashedAt)][0]{
    founders[]{
      name,
      jobTitle,
      jobTitleZh,
      professionalTitle,
      professionalTitleZh,
      image,
      bio,
      bioZh,
      sameAs
    }
  }
`)

/** Awards — meta, body, award entries (placeholder until real award data lands). */
export const AWARDS_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "awards" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    ${PAGE_CONTENT_FIELDS},
    awardItems[]{
      _key,
      title,
      titleZh,
      category,
      categoryZh,
      year,
      portfolioEntry->{
        _id,
        "slug": slug.current,
        "slugZh": slugZh.current
      }
    }
  }
`)

/** Work index metadata (SEO / OG). Body still from WORK_PAGE_QUERY. */
export const WORK_PAGE_META_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "work" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS}
  }
`)

/** Video Campaign Brief — metadata + titles (in META). */
export const VIDEO_CAMPAIGN_BRIEF_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "video-campaign-brief" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS}
  }
`)
