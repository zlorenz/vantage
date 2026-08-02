/**
 * seoFields — Shared SEO metadata object.
 *
 * Source: content-schema.md §4.10
 * WordPress origin: Yoast SEO meta description
 *
 * Optional metaTitle / ogImage override route-level Next.js metadata defaults.
 * Focus keyword / keyphrase synonyms are Yoast-internal and not migrated.
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair} from '../../lib/define-locale-pair'
import {hiddenForTranslator} from '../../lib/studio-roles'

export const seoFields = defineType({
  name: 'seoFields',
  title: 'SEO',
  type: 'object',

  fieldsets: [
    // Untitled layout row (legend hidden via studio.css — Sanity auto-titles from name).
    {name: 'metaTitleOgImage', options: {columns: 2}},
  ],

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

    ...defineLocalePair({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      fieldset: 'metaTitleOgImage',
      description:
        'Optional override for the page <title>. When set, replaces the route’s default title template.',
      optional: true,
    }),

    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      fieldset: 'metaTitleOgImage',
      options: {hotspot: true},
      description:
        'Optional override for the Open Graph / Twitter image. When set, replaces the per-route featured-image / default OG fallback.',
      hidden: hiddenForTranslator,
    }),
  ],
})
