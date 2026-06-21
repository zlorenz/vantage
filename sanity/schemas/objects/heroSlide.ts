/**
 * heroSlide — Homepage carousel slide referencing a portfolio entry.
 *
 * Source: content-schema.md §4.4 (page.heroSlides array)
 */

import { defineField, defineType } from 'sanity';

export const heroSlide = defineType({
  name: 'heroSlide',
  title: 'Hero Slide',
  type: 'object',

  fields: [
    defineField({
      name: 'portfolioRef',
      title: 'Portfolio Entry',
      type: 'reference',
      to: [{ type: 'portfolioEntry' }],
      description: 'Portfolio project featured in this carousel slide.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'buttonLabel',
      title: 'Button Label (English)',
      type: 'string',
      description: 'CTA button text. WordPress default: "Watch".',
      initialValue: 'Watch',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'buttonLabelZh',
      title: 'Button Label (Chinese)',
      type: 'string',
      description: 'Chinese CTA button text for /zh/ homepage.',
    }),
  ],

  preview: {
    select: {
      buttonLabel: 'buttonLabel',
      portfolioTitle: 'portfolioRef.title',
    },
    prepare({ buttonLabel, portfolioTitle }) {
      return {
        title: portfolioTitle || 'Hero slide',
        subtitle: buttonLabel,
      };
    },
  },
});
