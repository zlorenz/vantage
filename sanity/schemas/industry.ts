/**
 * industry — Portfolio industry taxonomy document.
 *
 * Source: content-schema.md §4.6
 * WordPress origin: `industry` taxonomy (applied to portfolio entries)
 *
 * URL pattern: /industry/[slug]/ (EN), /zh/产业/[slugZh]/ (ZH)
 */

import { defineField, defineType } from 'sanity';

export const industry = defineType({
  name: 'industry',
  title: 'Industry',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      description: 'Industry display name in English (canonical language).',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
      description: 'Industry display name in Chinese Simplified.',
    }),

    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      description:
        'URL slug for English archive pages (/industry/[slug]/). ' +
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
        'URL slug for Chinese archive pages (/zh/产业/[slug]/). ' +
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
        title: title || 'Untitled industry',
        subtitle: subtitle ? `中文: ${subtitle}` : undefined,
      };
    },
  },
});
