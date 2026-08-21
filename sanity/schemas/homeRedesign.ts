/**
 * homeRedesign — Singleton for the redesigned homepage (draft CMS).
 *
 * Separate from the live `page` document with slug "home". Studio-only for
 * now; frontend wiring comes later.
 */

import {defineField, defineType} from 'sanity'

export const homeRedesign = defineType({
  name: 'homeRedesign',
  title: 'Homepage Redesign',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Internal Studio label only — not shown on the frontend.',
      initialValue: 'Homepage Redesign (Draft)',
    }),

    defineField({
      name: 'carouselSlides',
      title: 'Carousel Slides',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'portfolioEntry'}]}],
      description:
        'Drag to reorder. Controls the homepage carousel on the redesign.',
    }),
  ],

  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title || 'Homepage Redesign'}
    },
  },
})
