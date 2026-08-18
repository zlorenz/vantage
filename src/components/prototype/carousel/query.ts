/**
 * Featured-work carousel GROQ — used by Home and /prototype/carousel.
 */

export const PROTOTYPE_CAROUSEL_ENTRIES_QUERY = `
  *[_type == "portfolioEntry" && slug.current in $slugs && !defined(trash.trashedAt)] {
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
  }
`;
