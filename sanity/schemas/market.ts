/**
 * market — Portfolio market taxonomy document.
 *
 * Source: content-schema.md §4.6
 * WordPress origin: `market` taxonomy (applied to portfolio entries)
 *
 * URL pattern: /market/[slug]/ (EN), /zh/市场/[slugZh]/ (ZH)
 */

import { defineField, defineType } from 'sanity';

export const market = defineType({
  name: 'market',
  title: 'Market',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      description: 'Market display name in English (canonical language).',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
      description: 'Market display name in Chinese Simplified.',
    }),

    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      description:
        'URL slug for English archive pages (/market/[slug]/). ' +
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
        'URL slug for Chinese archive pages (/zh/市场/[slug]/). ' +
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
        title: title || 'Untitled market',
        subtitle: subtitle ? `中文: ${subtitle}` : undefined,
      };
    },
  },
});
