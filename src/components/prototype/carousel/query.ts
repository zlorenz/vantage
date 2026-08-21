/**
 * Featured-work carousel GROQ — used by Home and /prototype/carousel.
 */

/** Shared portfolio projection for carousel slides (slug list or page refs). */
const PROTOTYPE_CAROUSEL_ENTRY_PROJECTION = `
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
  crewCredits[]{
    roleKey,
    people[]{ name }
  },
  videoFormats[]->{
    title,
    titleZh
  },
  featuredImage,
  vimeoUrl,
  previewStartSeconds,
  previewEndSeconds,
  previewCleanVimeoUrl
`

/** @deprecated Prefer HOME_REDESIGN_CAROUSEL_QUERY — kept for quick rollback. */
export const PROTOTYPE_CAROUSEL_ENTRIES_QUERY = `
  *[_type == "portfolioEntry" && slug.current in $slugs && !defined(trash.trashedAt)] {
    ${PROTOTYPE_CAROUSEL_ENTRY_PROJECTION}
  }
`;

/** Redesign homepage carousel — CMS order from page.carouselSlides. */
export const HOME_REDESIGN_CAROUSEL_QUERY = `
  *[_type == "page" && slug.current == "home-redesign"][0]{
    carouselSlides[
      !defined(@->trash.trashedAt)
    ]->{
      ${PROTOTYPE_CAROUSEL_ENTRY_PROJECTION}
    }
  }
`;
