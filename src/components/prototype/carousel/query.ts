/**
 * Prototype-only GROQ — not used by the live homepage or other production routes.
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
    headerTitleOverride,
    headerTitleOverrideZh,
    featuredImage,
    vimeoUrl
  }
`;
