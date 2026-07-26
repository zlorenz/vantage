/**
 * videoFormat — Portfolio video format taxonomy document.
 *
 * Source: content-schema.md §4.6
 * WordPress origin: `video-format` taxonomy (applied to portfolio entries)
 *
 * Used by portfolioEntry.videoFormats references and video-format archive pages.
 * URL pattern: /video-format/[slug]/ (EN), /zh/视频格式/[slugZh]/ (ZH)
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair} from '../lib/define-locale-pair'

export const videoFormat = defineType({
  name: 'videoFormat',
  title: 'Video Formats',
  type: 'document',

  fields: [
    ...defineLocalePair({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Format display name in English (e.g. Commercial Spot, Brand Film).',
      zhDescription: 'Format display name in Chinese Simplified.',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    ...defineLocalePair({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'URL slug for archive pages (/video-format/[slug]/ · /zh/视频格式/[slug]/). ' +
        'Must match live site slugs exactly for SEO. ZH is stored explicitly.',
      options: {source: 'title', maxLength: 96},
      zhOptions: {source: 'titleZh', maxLength: 96},
      validation: (rule) => rule.required(),
      optional: false,
    }),

    ...defineLocalePair({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 5,
      description: 'Intro paragraph on the archive page.',
      optional: true,
    }),

    defineField({
      name: 'parent',
      title: 'Parent Video Format',
      type: 'reference',
      to: [{type: 'videoFormat'}],
      description: 'Optional parent category for nested filter dropdowns.',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'titleZh',
      parentTitle: 'parent.title',
    },
    prepare({title, subtitle, parentTitle}) {
      const displayTitle = parentTitle ? `↳ ${title}` : title
      return {
        title: displayTitle || 'Untitled format',
        subtitle: subtitle ? `中文: ${subtitle}` : undefined,
      }
    },
  },
})
