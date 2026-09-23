/**
 * blogPost — Blog / news article document.
 *
 * Source: content-schema.md §4.3
 * WordPress origin: `post` (23 entries)
 *
 * URL pattern: /[slug]/ (EN) — root level, NOT under /news/
 * Chinese: /zh/[slugZh]/
 *
 * Parallel body fields: live `body`/`bodyZh` (main + hosted Studio) vs
 * `redesignBody`/`redesignBodyZh` (redesign branch only). See
 * `.cursor/docs/redesign-content-fields.md`.
 */

import {defineField, defineType} from 'sanity'

import {BodyPortableTextInput} from '../components/body/BodyPortableTextInput'
import {TaxonomyCheckboxInput} from '../components/TaxonomyCheckboxInput'
import {defineLocalePair, hideZhPortableText, hiddenForTranslatorWhenEmpty} from '../lib/define-locale-pair'
import {getStudioRole, hiddenForTranslator} from '../lib/studio-roles'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Posts',
  type: 'document',

  groups: [
    {name: 'live', title: 'Legacy / Live Content', default: true},
    {name: 'redesign', title: 'Redesign Content'},
  ],

  fieldsets: [
    {name: 'card', title: 'Card', options: {columns: 2}},
    // Untitled layout row (legend hidden via studio.css — Sanity auto-titles from name).
    {name: 'slugAndDate', options: {columns: 2}},
  ],

  fields: [
    ...defineLocalePair({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'live',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'live',
      fieldset: 'card',
      options: {hotspot: true},
      hidden: hiddenForTranslator,
    }),

    ...defineLocalePair({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'live',
      fieldset: 'card',
      description: 'Card / teaser copy. Usually the former body lead paragraph.',
      optional: true,
    }),

    ...defineLocalePair({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'live',
      fieldset: 'slugAndDate',
      description: 'Root-level URL: /[slug]/ — not /news/[slug]/. ZH: /zh/[slug]/',
      options: {source: 'title', maxLength: 96},
      zhOptions: {source: 'titleZh', maxLength: 96},
      validation: (rule) => rule.required(),
      optional: false,
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'live',
      fieldset: 'slugAndDate',
      validation: (rule) => rule.required(),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'live',
      of: [{type: 'reference', to: [{type: 'category'}]}],
      components: {input: TaxonomyCheckboxInput},
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'relatedCase',
      title: 'Related Case',
      type: 'reference',
      group: 'live',
      to: [{type: 'portfolioEntry'}],
      description:
        'Optional. When set, the post hero plays this portfolio entry’s videos (same carousel as the case page).',
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'mainVideo',
      title: 'Main Video',
      type: 'videoEmbed',
      group: 'live',
      description:
        'Fallback hero video when Related Case is empty. Vimeo or YouTube URL. Mid-body videos stay in the body.',
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'body',
      title: 'Body (English)',
      type: 'portableTextBody',
      group: 'live',
      components: {input: BodyPortableTextInput},
      validation: (rule) => rule.required(),
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'translator',
      hidden: hiddenForTranslatorWhenEmpty,
    }),

    defineField({
      name: 'bodyZh',
      title: 'Body (Chinese)',
      type: 'portableTextBody',
      group: 'live',
      components: {input: BodyPortableTextInput},
      hidden: hideZhPortableText('body'),
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'editor',
    }),

    defineField({
      name: 'redesignBody',
      title: 'Redesign Body (English)',
      type: 'portableTextBody',
      group: 'redesign',
      description:
        'Parallel body for the redesign branch only. Live body/bodyZh stay untouched — see .cursor/docs/redesign-content-fields.md.',
      components: {input: BodyPortableTextInput},
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'translator',
      hidden: hiddenForTranslatorWhenEmpty,
    }),

    defineField({
      name: 'redesignBodyZh',
      title: 'Redesign Body (Chinese)',
      type: 'portableTextBody',
      group: 'redesign',
      components: {input: BodyPortableTextInput},
      hidden: hideZhPortableText('redesignBody'),
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'editor',
    }),

    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      group: 'live',
      description: 'Exclude from search indexing and sitemap (typically work-internal).',
      initialValue: false,
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoFields',
      group: 'live',
    }),

    defineField({
      name: 'trash',
      type: 'trashMetadata',
      group: 'live',
      hidden: true,
      readOnly: true,
    }),
  ],

  orderings: [
    {
      title: 'Published Date, Newest',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'titleZh',
      media: 'featuredImage',
      date: 'publishedAt',
    },
    prepare({title, subtitle, media, date}) {
      return {
        title,
        subtitle: subtitle || (date ? new Date(date).toLocaleDateString() : undefined),
        media,
      }
    },
  },
})
