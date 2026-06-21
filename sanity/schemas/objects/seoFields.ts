/**
 * seoFields — Shared SEO metadata object.
 *
 * Source: content-schema.md §4.10
 * WordPress origin: Yoast SEO meta description and focus keyword
 *
 * SEO titles are generated in the Next.js metadata API — not stored per entry.
 */

import { defineField, defineType } from 'sanity';

export const seoFields = defineType({
  name: 'seoFields',
  title: 'SEO',
  type: 'object',

  fields: [
    defineField({
      name: 'metaDescription',
      title: 'Meta Description (English)',
      type: 'text',
      rows: 3,
      description:
        'Primary SEO meta description for English pages. 171/173 entries populated in WordPress.',
    }),

    defineField({
      name: 'metaDescriptionZh',
      title: 'Meta Description (Chinese)',
      type: 'text',
      rows: 3,
      description: 'SEO meta description for Chinese pages (from TranslatePress).',
    }),

    defineField({
      name: 'focusKeyword',
      title: 'Focus Keyword',
      type: 'string',
      description:
        'Optional editorial reference from Yoast. Not used for rendering or SEO output.',
    }),
  ],
});
