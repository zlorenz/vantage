/**
 * industry — Portfolio industry taxonomy document.
 *
 * Source: content-schema.md §4.6
 * WordPress origin: `industry` taxonomy (applied to portfolio entries)
 *
 * URL pattern: /industry/[slug]/ (EN), /zh/产业/[slugZh]/ (ZH)
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair} from '../lib/define-locale-pair'

export const industry = defineType({
  name: 'industry',
  title: 'Industries',
  type: 'document',

  fields: [
    ...defineLocalePair({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Industry display name in English (canonical language).',
      zhDescription: 'Industry display name in Chinese Simplified.',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    ...defineLocalePair({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'URL slug for archive pages (/industry/[slug]/ · /zh/产业/[slug]/). ' +
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
      title: 'Parent Industry',
      type: 'reference',
      to: [{type: 'industry'}],
      description:
        'Optional parent category (e.g. Tech groups AI & Robotics, Drones, Electronics).',
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
        title: displayTitle || 'Untitled industry',
        subtitle: subtitle ? `中文: ${subtitle}` : undefined,
      }
    },
  },
})
