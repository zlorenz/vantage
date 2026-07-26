/**
 * Page GROQ queries — static CMS pages (home, about, news, Vietnam, etc.).
 */

import {defineQuery} from 'groq'

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
  body,
  bodyZh,
  seo{
    metaDescription,
    metaDescriptionZh,
    metaTitle,
    metaTitleZh,
    ogImage
  },
  noIndex
`

const HOME_HERO_SLIDE_FIELDS = `
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
  headerTitleOverride,
  headerTitleOverrideZh,
  "description": coalesce(excerpt, seo.metaDescription),
  "descriptionZh": coalesce(excerptZh, seo.metaDescriptionZh),
  featuredImage
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
  body,
  bodyZh
`

/** Homepage — hero carousel slides, featured work grid, body copy, brand logos. */
export const HOME_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "home" && !defined(trash.trashedAt)][0]{
    ${PAGE_BASE_FIELDS},
    "heroSlides": heroSlides[
      !defined(@->trash.trashedAt)
    ]->{
      ${HOME_HERO_SLIDE_FIELDS}
    },
    "featuredWork": featuredWork[
      !defined(@->trash.trashedAt) && @->isHidden != true
    ]->{
      ${FEATURED_WORK_FIELDS}
    },
    brandLogos[]{
      logoId
    }
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
      image
    }
  }
`)

/** Contact — metadata only (page body opens ContactModal). */
export const CONTACT_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "contact" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS}
  }
`)

/** News index — meta + hero/body intro. */
export const NEWS_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "news" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    ${PAGE_CONTENT_FIELDS}
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

/** Vietnam Production Service — meta, body, curated featured work. */
export const VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "vietnam-production-service" && !defined(trash.trashedAt)][0]{
    ${PAGE_META_FIELDS},
    ${PAGE_CONTENT_FIELDS},
    "featuredWork": featuredWork[
      !defined(@->trash.trashedAt) && @->isHidden != true
    ]->{
      ${FEATURED_WORK_FIELDS}
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
