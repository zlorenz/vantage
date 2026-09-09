/**
 * Showreel GROQ queries — editor + (later) public page.
 */

/** Editor payload: fields + dereferenced portfolio rows for the utility list. */
export const SHOWREEL_EDITOR_QUERY = `
  *[_type == "showreel" && _id == $id && !(_id in path("drafts.**"))][0]{
    _id,
    title,
    description,
    "items": portfolioItems[]->{
      _id,
      title,
      titleZh,
      displayTitleParts{
        brandName,
        productName,
        campaignTitle,
        brandNameZh,
        productNameZh,
        campaignTitleZh
      },
      featuredImage,
      "slug": slug.current,
      "slugZh": slugZh.current
    }
  }
`
