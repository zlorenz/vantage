/**
 * Search GROQ queries — portfolio entries and blog posts by title match.
 */

export const SEARCH_QUERY = `
  *[_type in ["portfolioEntry", "blogPost"]
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
    "excerpt": select(_type == "blogPost" => pt::text(body), description)
  }
`;
