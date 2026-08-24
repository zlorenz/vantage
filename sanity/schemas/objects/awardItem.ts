/**
 * awardItem — single award/recognition entry for the Awards page.
 *
 * Additive, isolated to page.awardItems (Awards page only, see
 * hideUnlessPageSlug('awards') in page.ts). Entries are placeholder/invented
 * until real award data is supplied — see AGENTS/commit notes.
 */

import {defineField, defineType} from 'sanity'

export const awardItem = defineType({
  name: 'awardItem',
  title: 'Award Item',
  type: 'object',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Award name (e.g. "Sample Award Category").',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Category/discipline the award was given in.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'categoryZh',
      title: 'Category (Chinese)',
      type: 'string',
    }),

    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'portfolioEntry',
      title: 'Linked Project',
      type: 'reference',
      to: [{type: 'portfolioEntry'}],
      description: 'Optional — link this award to a real project once available.',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      category: 'category',
      year: 'year',
    },
    prepare({title, category, year}) {
      return {
        title,
        subtitle: [category, year].filter(Boolean).join(' — '),
      }
    },
  },
})
