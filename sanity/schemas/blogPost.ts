/**
 * blogPost — Blog / news article document.
 *
 * Source: content-schema.md §4.3
 * WordPress origin: `post` (23 entries)
 *
 * URL pattern: /[slug]/ (EN) — root level, NOT under /news/
 * Chinese: /zh/[slugZh]/
 */

import {defineField, defineType} from 'sanity'

import {BodyPortableTextInput} from '../components/body/BodyPortableTextInput'
import {TaxonomyCheckboxInput} from '../components/TaxonomyCheckboxInput'
import {defineLocalePair, hideZhPortableText} from '../lib/define-locale-pair'
import {getStudioRole} from '../lib/studio-roles'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Posts',
  type: 'document',

  fieldsets: [
    {name: 'card', title: 'Card', options: {columns: 2}},
  ],

  fields: [
    ...defineLocalePair({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      fieldset: 'card',
      options: {hotspot: true},
    }),

    ...defineLocalePair({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      fieldset: 'card',
      description: 'Card / teaser copy. Usually the former body lead paragraph.',
      optional: true,
    }),

    ...defineLocalePair({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Root-level URL: /[slug]/ — not /news/[slug]/. ZH: /zh/[slug]/',
      options: {source: 'title', maxLength: 96},
      zhOptions: {source: 'titleZh', maxLength: 96},
      validation: (rule) => rule.required(),
      optional: false,
    }),

    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'category'}]}],
      components: {input: TaxonomyCheckboxInput},
    }),

    defineField({
      name: 'body',
      title: 'Body (English)',
      type: 'portableTextBody',
      components: {input: BodyPortableTextInput},
      validation: (rule) => rule.required(),
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'translator',
    }),

    defineField({
      name: 'bodyZh',
      title: 'Body (Chinese)',
      type: 'portableTextBody',
      components: {input: BodyPortableTextInput},
      hidden: hideZhPortableText('body'),
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'editor',
    }),

    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      description: 'Exclude from search indexing and sitemap (typically work-internal).',
      initialValue: false,
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoFields',
    }),

    defineField({
      name: 'trash',
      type: 'trashMetadata',
      hidden: true,
      readOnly: true,
    }),
  ],

  orderings: [
    {
      title: 'Created, Newest',
      name: 'createdAtDesc',
      by: [{field: '_createdAt', direction: 'desc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'titleZh',
      media: 'featuredImage',
    },
    prepare({title, subtitle, media}) {
      return {
        title,
        subtitle,
        media,
      }
    },
  },
})
