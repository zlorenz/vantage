/**
 * Featured-work carousel GROQ — used by Home and /prototype/carousel.
 */

/** Shared portfolio projection for carousel slides. */
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
