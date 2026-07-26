/**
 * seoFields — Shared SEO metadata object.
 *
 * Source: content-schema.md §4.10
 * WordPress origin: Yoast SEO meta description
 *
 * SEO titles are generated in the Next.js metadata API — not stored per entry.
 * Focus keyword / keyphrase synonyms are Yoast-internal and not migrated.
 */

import {defineType} from 'sanity'

import {defineLocalePair} from '../../lib/define-locale-pair'

export const seoFields = defineType({
  name: 'seoFields',
  title: 'SEO',
  type: 'object',

  fields: [
    ...defineLocalePair({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description:
        'Primary SEO meta description for English pages. 171/173 entries populated in WordPress.',
      optional: true,
    }),
  ],
})
