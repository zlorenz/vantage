/**
 * duplicateDismissal — Internal record that a creditIdentity pair is not a duplicate.
 *
 * String IDs only (never strong refs), same pattern as trashRecord.targetId, so
 * dismissals survive identity delete/merge. pairKey is order-independent.
 */

import {defineField, defineType} from 'sanity'

export const duplicateDismissal = defineType({
  name: 'duplicateDismissal',
  title: 'Duplicate Dismissal',
  type: 'document',
  // Internal audit only — Content tool / detector owns this lifecycle.
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: 'pairKey',
      title: 'Pair Key',
      type: 'string',
      description: 'Canonical `${minId}|${maxId}` for the dismissed identity pair.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'identityA',
      title: 'Identity A',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'identityB',
      title: 'Identity B',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'dismissedAt',
      title: 'Dismissed At',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'dismissedBy',
      title: 'Dismissed By',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'pairKey',
      subtitle: 'dismissedAt',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Dismissed pair',
        subtitle: subtitle ? new Date(subtitle).toLocaleString() : undefined,
      }
    },
  },
})
