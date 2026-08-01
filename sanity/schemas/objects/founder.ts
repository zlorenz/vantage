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

    ...defineLocalePair({
      name: 'professionalTitle',
      title: 'Professional Title',
      type: 'string',
      description:
        "Public-facing professional title for SEO/structured data (e.g. 'Commercial Film Director'). Leave blank to reuse the internal Job Title above. Does not affect what's displayed on the About page team cards.",
      optional: true,
    }),

    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
      readOnly: readOnlyForTranslator,
    }),

    ...defineLocalePair({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
      description: 'Short plain-text bio for structured data / Person description.',
      optional: true,
    }),

    defineField({
      name: 'sameAs',
      title: 'Social / Profile Links',
      type: 'array',
      of: [{type: 'url'}],
      description: 'Website and social profile URLs (schema.org sameAs).',
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
