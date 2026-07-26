/**
 * category — Blog category taxonomy document.
 *
 * Source: content-schema.md §4.6
 * WordPress origin: `category` taxonomy (applied to posts)
 *
 * Used by blogPost.categories references and category archive pages.
 * URL pattern: /category/[slug]/ (EN), /zh/类别/[slugZh]/ (ZH)
 */

import {defineType} from 'sanity'

import {defineLocalePair} from '../lib/define-locale-pair'

export const category = defineType({
  name: 'category',
  title: 'Categories',
  type: 'document',

  fields: [
    ...defineLocalePair({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Category display name in English (canonical language).',
      zhDescription: 'Category display name in Chinese Simplified.',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    ...defineLocalePair({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'URL slug for archive pages (/category/[slug]/ · /zh/类别/[slug]/). ' +
        'Must match live site slugs exactly for SEO. ZH is stored explicitly.',
      options: {source: 'title', maxLength: 96},
      zhOptions: {source: 'titleZh', maxLength: 96},
      validation: (rule) => rule.required(),
      optional: false,
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'titleZh',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Untitled category',
        subtitle: subtitle ? `中文: ${subtitle}` : undefined,
      }
    },
  },
})
