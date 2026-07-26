/**
 * creditIdentity — Stable vendor entity for credited people / brands / companies.
 *
 * Opaque `_id` (ci_…) is identity. `name` is display-only and may change.
 * Role (Brand, Director, DOP, …) lives on the credit row, never here.
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair} from '../lib/define-locale-pair'

export const creditIdentity = defineType({
  name: 'creditIdentity',
  title: 'Crew Members',
  type: 'document',

  fields: [
    ...defineLocalePair({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        'Display name. Renaming updates how this vendor appears; the document ID stays the same. ' +
        'Optional Mandarin name for China — leave empty when not applicable. Never AI-invented.',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    defineField({
      name: 'url',
      title: 'Default URL',
      type: 'url',
      description:
        'Canonical profile or company link. Credits inherit this automatically — edit once here or from any credit chip.',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'nameZh',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Untitled identity',
        subtitle: subtitle ? `中文: ${subtitle}` : undefined,
      }
    },
  },
})
