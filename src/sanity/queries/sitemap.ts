/**
 * GROQ queries for sitemap generation — slug and publishedAt only.
 */

export const SITEMAP_PORTFOLIO_QUERY = `
  *[_type == "portfolioEntry" && !isHidden] | order(publishedAt desc) {
    "slug": slug.current,
    "slugZh": slugZh.current,
    publishedAt
  }
`;

export const SITEMAP_BLOG_POSTS_QUERY = `
  *[_type == "blogPost"] | order(publishedAt desc) {
    "slug": slug.current,
    "slugZh": slugZh.current,
    publishedAt
  }
`;

export const SITEMAP_VIDEO_FORMATS_QUERY = `
  *[_type == "videoFormat"] | order(title asc) {
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;

export const SITEMAP_INDUSTRIES_QUERY = `
  *[_type == "industry"] | order(title asc) {
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;

export const SITEMAP_MARKETS_QUERY = `
  *[_type == "market"] | order(title asc) {
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;
