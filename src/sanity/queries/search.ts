/**
 * Search GROQ queries — portfolio entries and blog posts by title match (EN + ZH).
 */

export const SEARCH_QUERY = `
  *[_type in ["portfolioEntry", "blogPost"]
    && !defined(trash.trashedAt)
    && !(_type == "portfolioEntry" && isHidden == true)
    && (
      lower(title) match $searchTerm + "*"
      || (defined(titleZh) && lower(titleZh) match $searchTerm + "*")
      || (defined(description) && lower(description) match $searchTerm + "*")
      || (defined(descriptionZh) && lower(descriptionZh) match $searchTerm + "*")
    )]
  | order(
      _type asc,
      select(_type == "portfolioEntry" || _type == "blogPost" => publishedAt, _createdAt) desc
    ) {
    _type,
    title,
    titleZh,
    "slug": slug.current,
    "slugZh": slugZh.current,
    "publishedAt": select(
      _type == "portfolioEntry" || _type == "blogPost" => publishedAt,
      _createdAt
    ),
    featuredImage,
    description,
    descriptionZh,
    "excerpt": select(_type == "blogPost" => excerpt, description),
    "excerptZh": select(
      _type == "blogPost" => excerptZh,
      coalesce(descriptionZh, description)
    ),
    "bodyText": select(_type == "blogPost" => pt::text(body), null),
    "bodyTextZh": select(_type == "blogPost" => pt::text(bodyZh), null)
  }
`;
