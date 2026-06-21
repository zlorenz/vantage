/**
 * videoFormat — Portfolio video format taxonomy document.
 *
 * Source: content-schema.md §4.6
 * WordPress origin: `video-format` taxonomy (applied to portfolio entries)
 *
 * Used by portfolioEntry.videoFormats references and video-format archive pages.
 * URL pattern: /video-format/[slug]/ (EN), /zh/视频格式/[slugZh]/ (ZH)
 */

import { defineField, defineType } from 'sanity';

export const videoFormat = defineType({
  name: 'videoFormat',
  title: 'Video Format',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      description:
        'Format display name in English (e.g. Commercial Spot, Brand Film).',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
      description: 'Format display name in Chinese Simplified.',
    }),

    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      description:
        'URL slug for English archive pages (/video-format/[slug]/). ' +
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
        'URL slug for Chinese archive pages (/zh/视频格式/[slug]/). ' +
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
        title: title || 'Untitled format',
        subtitle: subtitle ? `中文: ${subtitle}` : undefined,
      };
    },
  },
});
