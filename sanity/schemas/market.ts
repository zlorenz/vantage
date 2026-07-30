/**
 * market — Portfolio market taxonomy document.
 *
 * Source: content-schema.md §4.6
 * WordPress origin: `market` taxonomy (applied to portfolio entries)
 *
 * URL pattern: /market/[slug]/ (EN), /zh/市场/[slugZh]/ (ZH)
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair} from '../lib/define-locale-pair'
import {hiddenForTranslator} from '../lib/studio-roles'

export const market = defineType({
  name: 'market',
  title: 'Markets',
  type: 'document',

  fields: [
    ...defineLocalePair({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Market display name in English (canonical language).',
      zhDescription: 'Market display name in Chinese Simplified.',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    ...defineLocalePair({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'URL slug for archive pages (/market/[slug]/ · /zh/市场/[slug]/). ' +
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
      title: 'Parent Market',
      type: 'reference',
      to: [{type: 'market'}],
      description: 'Optional parent category for nested filter dropdowns.',
      hidden: hiddenForTranslator,
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
        title: displayTitle || 'Untitled market',
        subtitle: subtitle ? `中文: ${subtitle}` : undefined,
      }
    },
  },
})
