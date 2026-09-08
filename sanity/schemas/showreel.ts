/**
 * showreel — Producer-curated portfolio selection shared via opaque public URL.
 *
 * Created/edited via password-gated site APIs (not Studio day-to-day).
 * Omitted from Structure desk; Create blocked in sanity.config.ts.
 */

import {defineField, defineType} from 'sanity'

export const showreel = defineType({
  name: 'showreel',
  title: 'Showreel',
  type: 'document',
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'portfolioItems',
      title: 'Portfolio Items',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'portfolioEntry'}]}],
      description: 'Ordered list — drag to reorder. At least one item required.',
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      items: 'portfolioItems',
    },
    prepare({title, items}) {
      const count = Array.isArray(items) ? items.length : 0
      return {
        title: title || 'Untitled showreel',
        subtitle: count === 1 ? '1 portfolio item' : `${count} portfolio items`,
      }
    },
  },
})
