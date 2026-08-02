/**
 * Blog GROQ queries — news index, single posts, category archives.
 */

import {defineQuery} from 'groq'

import {PORTABLE_TEXT_WITH_IMAGE_ASSETS} from './portable-text'

const BLOG_CARD_FIELDS = `
  _id,
  title,
  titleZh,
  "slug": slug.current,
  "slugZh": slugZh.current,
  publishedAt,
  _createdAt,
  featuredImage,
  excerpt,
  excerptZh,
  "bodyText": pt::text(body),
  "bodyTextZh": pt::text(bodyZh)
`;

/** All published blog posts for the news index. */
export const ALL_POSTS_QUERY = `
  *[_type == "blogPost" && !defined(trash.trashedAt)] | order(publishedAt desc) {
    ${BLOG_CARD_FIELDS},
    "categories": categories[]->{
      title,
      titleZh,
      "slug": slug.current,
      "slugZh": slugZh.current
    }
  }
`;

/** Single blog post by English or Chinese slug. */
export const POST_BY_SLUG_QUERY = defineQuery(`
  *[_type == "blogPost" && !defined(trash.trashedAt) && (
    slug.current == $slug || slugZh.current == $slug
  )][0]{
    _id,
    title,
    titleZh,
    "slug": slug.current,
    "slugZh": slugZh.current,
    publishedAt,
    _createdAt,
    _updatedAt,
    featuredImage,
    excerpt,
    excerptZh,
    "body": body${PORTABLE_TEXT_WITH_IMAGE_ASSETS},
    "bodyZh": bodyZh${PORTABLE_TEXT_WITH_IMAGE_ASSETS},
    "categories": categories[]->{
      _id,
      title,
      titleZh,
      "slug": slug.current,
      "slugZh": slugZh.current
    },
    noIndex,
    seo{
      metaDescription,
      metaDescriptionZh,
      metaTitle,
      metaTitleZh,
      ogImage
    }
  }
`)

/** All blog post slugs for generateStaticParams. */
export const POST_SLUGS_QUERY = `
  *[_type == "blogPost" && !defined(trash.trashedAt)] | order(publishedAt desc) {
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;

/** Posts filtered by category slug (EN or ZH). */
export const POSTS_BY_CATEGORY_QUERY = `
  *[_type == "blogPost" && !defined(trash.trashedAt) && references(*[
    _type == "category" && (
      slug.current == $slug || slugZh.current == $slug
    )
  ][0]._id)] | order(publishedAt desc) {
    ${BLOG_CARD_FIELDS},
    "categories": categories[]->{
      title,
      titleZh,
      "slug": slug.current,
      "slugZh": slugZh.current
    }
  }
`;

/** All category slugs for generateStaticParams. */
export const CATEGORY_SLUGS_QUERY = `
  *[_type == "category"] | order(title asc) {
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;

/** Resolve a category term by slug. */
export const CATEGORY_BY_SLUG_QUERY = `
  *[_type == "category" && (
    slug.current == $slug || slugZh.current == $slug
  )][0]{
    _id,
    title,
    titleZh,
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;

/** Featured image from the most recent post in a category — archive hero. */
export const CATEGORY_HERO_IMAGE_QUERY = `
  *[_type == "blogPost" && !defined(trash.trashedAt) && references(*[
    _type == "category" && (
      slug.current == $slug || slugZh.current == $slug
    )
  ][0]._id)] | order(publishedAt desc)[0].featuredImage
`;

/** All categories for sidebar navigation. */
export const ALL_CATEGORIES_QUERY = `
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    titleZh,
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;

/** Reserved slugs that must not be handled by the blog catch-all route. */
export const RESERVED_PAGE_SLUGS = [
  'about',
  'work',
  'work-internal',
  'news',
  'contact',
  'vietnam-production-service',
  'vietnam-location-guide',
  'video-campaign-brief',
  'search',
] as const;
