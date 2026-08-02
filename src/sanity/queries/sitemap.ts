/**
 * GROQ queries for sitemap generation — slug + lastmod date.
 */

import {defineQuery} from 'groq'

export const SITEMAP_PORTFOLIO_QUERY = `
  *[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt)] | order(publishedAt desc) {
    "slug": slug.current,
    "slugZh": slugZh.current,
    publishedAt
  }
`;

export const SITEMAP_BLOG_POSTS_QUERY = `
  *[_type == "blogPost" && noIndex != true && !defined(trash.trashedAt)] | order(_updatedAt desc) {
    "slug": slug.current,
    "slugZh": slugZh.current,
    "_updatedAt": _updatedAt
  }
`;

/** Allowlisted static pages — contact / work-internal excluded by design. */
export const SITEMAP_PAGES_QUERY = defineQuery(`
  *[_type == "page"
    && slug.current in ["home", "work", "about", "news",
        "vietnam-production-service", "vietnam-location-guide",
        "video-campaign-brief"]
    && noIndex != true
    && !defined(trash.trashedAt)] {
    "slug": slug.current,
    "slugZh": slugZh.current,
    "_updatedAt": _updatedAt
  }
`)

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
