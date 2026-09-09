/**
 * Showreel GROQ queries — editor + public share page.
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

/** Public share page — English fields only for v1 (ZH route mirrors EN content). */
export const SHOWREEL_PUBLIC_QUERY = `
  *[_type == "showreel" && _id == $id && !(_id in path("drafts.**"))][0]{
    _id,
    title,
    description,
    "items": portfolioItems[]->{
      _id,
      title,
      displayTitleParts{
        brandName,
        productName,
        campaignTitle,
        brandNameZh,
        productNameZh,
        campaignTitleZh
      },
      thumbTitleOverride,
      featuredImage,
      "slug": slug.current,
      "videos": videos[0...1]{vimeoUrl, xinpianchangUrl},
      vimeoUrl,
      xinpianchangUrl
    }
  }
`
