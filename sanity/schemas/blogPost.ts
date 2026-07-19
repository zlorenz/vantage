/**
 * blogPost — Blog / news article document.
 *
 * Source: content-schema.md §4.3
 * WordPress origin: `post` (23 entries)
 *
 * URL pattern: /[slug]/ (EN) — root level, NOT under /news/
 * Chinese: /zh/[slugZh]/
 */

import { defineField, defineType } from 'sanity';

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Posts',
  type: 'document',

  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'body', title: 'Body' },
    { name: 'seo', title: 'SEO' },
  ],

  fieldsets: [
    { name: 'titles', title: 'Titles', options: { columns: 2 } },
    { name: 'slugs', title: 'Slugs', options: { columns: 2 } },
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      group: 'content',
      fieldset: 'titles',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
      group: 'content',
      fieldset: 'titles',
    }),

    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      group: 'content',
      fieldset: 'slugs',
      description: 'Root-level URL: /[slug]/ — not /news/[slug]/.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slugZh',
      title: 'Slug (Chinese)',
      type: 'slug',
      group: 'content',
      fieldset: 'slugs',
      description: 'URL: /zh/[slug]/',
      options: { source: 'titleZh', maxLength: 96 },
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'content',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
    }),

    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),

    defineField({
      name: 'excerptZh',
      title: 'Excerpt (Chinese)',
      type: 'text',
      group: 'content',
      description: 'Optional Chinese card excerpt. Falls back to bodyZh when empty.',
      rows: 3,
    }),

    defineField({
      name: 'body',
      title: 'Body (English)',
      type: 'array',
      group: 'body',
      of: [{ type: 'block' }, { type: 'image' }],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'bodyZh',
      title: 'Body (Chinese)',
      type: 'array',
      group: 'body',
      of: [{ type: 'block' }, { type: 'image' }],
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoFields',
      group: 'seo',
    }),

    defineField({
      name: 'trash',
      type: 'trashMetadata',
      hidden: true,
      readOnly: true,
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
