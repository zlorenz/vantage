/**
 * category — Blog category taxonomy document.
 *
 * Source: content-schema.md §4.6
 * WordPress origin: `category` taxonomy (applied to posts)
 *
 * Used by blogPost.categories references and category archive pages.
 * URL pattern: /category/[slug]/ (EN), /zh/类别/[slugZh]/ (ZH)
 */

import { defineField, defineType } from 'sanity';

export const category = defineType({
  name: 'category',
  title: 'Blog Category',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      description: 'Category display name in English (canonical language).',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
      description: 'Category display name in Chinese Simplified.',
    }),

    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      description:
        'URL slug for English archive pages (/category/[slug]/). ' +
        'Must match live site slugs exactly for SEO.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slugZh',
      title: 'Slug (Chinese)',
      type: 'slug',
      description:
        'URL slug for Chinese archive pages (/zh/类别/[slug]/). ' +
        'Stored explicitly — never auto-generated from the English slug.',
      options: {
        source: 'titleZh',
        maxLength: 96,
      },
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'titleZh',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Untitled category',
        subtitle: subtitle ? `中文: ${subtitle}` : undefined,
      };
    },
  },
});
