/**
 * Search GROQ queries — portfolio entries and blog posts by title match.
 */

export const SEARCH_QUERY = `
  *[_type in ["portfolioEntry", "blogPost"]
    && !defined(trash.trashedAt)
    && !(_type == "portfolioEntry" && isHidden)
    && lower(title) match $searchTerm + "*"]
  | order(_type asc, publishedAt desc) {
    _type,
    title,
    titleZh,
    "slug": slug.current,
    "slugZh": slugZh.current,
    publishedAt,
    featuredImage,
    description,
    descriptionZh,
    "excerpt": select(_type == "blogPost" => pt::text(body), description),
    "excerptZh": select(
      _type == "blogPost" => coalesce(excerptZh, pt::text(bodyZh)),
      coalesce(descriptionZh, description)
    )
  }
`;
