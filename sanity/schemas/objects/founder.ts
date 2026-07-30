/**
 * founder — About page team card (name, title, photo).
 *
 * Source: content-schema.md §4.4 (page.founders array)
 */

import {defineField, defineType} from 'sanity'

import {TranslatorLockedArrayItem} from '../../components/TranslatorLockedArrayInput'
import {defineLocalePair} from '../../lib/define-locale-pair'
import {readOnlyForTranslator} from '../../lib/studio-roles'

export const founder = defineType({
  name: 'founder',
  title: 'Founder',
  type: 'object',

  components: {
    item: TranslatorLockedArrayItem,
  },

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: readOnlyForTranslator,
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
      readOnly: readOnlyForTranslator,
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
