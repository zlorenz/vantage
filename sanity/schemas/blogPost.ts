/**
 * blogPost — Blog / news article document.
 *
 * Source: content-schema.md §4.3
 * WordPress origin: `post` (23 entries)
 *
 * URL pattern: /[slug]/ (EN) — root level, NOT under /news/
 * Chinese: /zh/[slugZh]/
 *
 * Blog comments are dropped in the rebuild (§4.3).
 */

import { defineField, defineType } from 'sanity';

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
    }),

    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      description:
        'Root-level URL: /[slug]/ — NOT /news/[slug]/. Critical for SEO preservation.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slugZh',
      title: 'Slug (Chinese)',
      type: 'slug',
      description: 'Chinese URL slug for /zh/[slug]/ pages.',
      options: { source: 'titleZh', maxLength: 96 },
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
    }),

    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),

    defineField({
      name: 'body',
      title: 'Body (English)',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image' }],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'bodyZh',
      title: 'Body (Chinese)',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image' }],
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoFields',
    }),
  ],

  orderings: [
    {
      title: 'Published Date, Newest',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'titleZh',
      media: 'featuredImage',
      date: 'publishedAt',
    },
    prepare({ title, subtitle, media, date }) {
      return {
        title,
        subtitle: subtitle || (date ? new Date(date).toLocaleDateString() : undefined),
        media,
      };
    },
  },
});
