/**
 * founder — About page team card (name, title, photo).
 *
 * Source: content-schema.md §4.4 (page.founders array)
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair} from '../../lib/define-locale-pair'

export const founder = defineType({
  name: 'founder',
  title: 'Founder',
  type: 'object',

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    ...defineLocalePair({
      name: 'jobTitle',
      title: 'Job Title',
      type: 'string',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'jobTitle',
      media: 'image',
    },
  },
})
