/**
 * Blog GROQ queries — news index, single posts, category archives.
 */

const BLOG_CARD_FIELDS = `
  _id,
  title,
  titleZh,
  "slug": slug.current,
  "slugZh": slugZh.current,
  publishedAt,
  featuredImage,
  "excerpt": pt::text(body)
`;

/** All published blog posts for the news index. */
export const ALL_POSTS_QUERY = `
  *[_type == "blogPost"] | order(publishedAt desc) {
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
export const POST_BY_SLUG_QUERY = `
  *[_type == "blogPost" && (
    slug.current == $slug || slugZh.current == $slug
  )][0]{
    _id,
    title,
    titleZh,
    "slug": slug.current,
    "slugZh": slugZh.current,
    publishedAt,
    featuredImage,
    body,
    bodyZh,
    "categories": categories[]->{
      _id,
      title,
      titleZh,
      "slug": slug.current,
      "slugZh": slugZh.current
    },
    seo{
      metaDescription,
      metaDescriptionZh,
      focusKeyword
    }
  }
`;

/** All blog post slugs for generateStaticParams. */
export const POST_SLUGS_QUERY = `
  *[_type == "blogPost"] | order(publishedAt desc) {
    "slug": slug.current,
    "slugZh": slugZh.current
  }
`;

/** Posts filtered by category slug (EN or ZH). */
export const POSTS_BY_CATEGORY_QUERY = `
  *[_type == "blogPost" && references(*[
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
  *[_type == "blogPost" && references(*[
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
