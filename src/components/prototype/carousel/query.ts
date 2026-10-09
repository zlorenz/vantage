/**
 * Featured-work carousel GROQ — used by Home and Work index.
 */

/** Shared portfolio projection for carousel slides. */
const HOME_CAROUSEL_ENTRY_PROJECTION = `
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
    titleZh,
    "slug": slug.current,
    "slugZh": slugZh.current
  },
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

/** Homepage carousel — CMS order from page.carouselSlides on canonical `home`. */
export const HOME_CAROUSEL_QUERY = `
  *[_type == "page" && slug.current == "home"][0]{
    carouselSlides[
      !defined(@->trash.trashedAt)
    ]->{
      ${HOME_CAROUSEL_ENTRY_PROJECTION}
    }
  }
`;
