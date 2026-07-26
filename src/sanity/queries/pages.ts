/**
 * Page GROQ queries — static CMS pages (home, about, news, Vietnam, etc.).
 */

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
    metaDescriptionZh
  },
  noIndex
`;

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
`;

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
`;

/** Any page document by English slug. */
export const PAGE_BY_SLUG_QUERY = `
  *[_type == "page" && slug.current == $slug && !defined(trash.trashedAt)][0]{
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
    founders[]{
      name,
      jobTitle,
      jobTitleZh,
      image
    },
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
`;

/** Homepage — hero carousel slides, featured work grid, body copy, brand logos. */
export const HOME_PAGE_QUERY = `
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
`;
