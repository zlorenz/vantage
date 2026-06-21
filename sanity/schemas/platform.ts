/**
 * platform — Internal platform/distribution taxonomy document.
 *
 * Source: content-schema.md §4.9
 * WordPress origin: `platform` taxonomy (108 terms)
 *
 * Referenced from portfolioEntry.platforms. Not exposed on public taxonomy archives.
 */

import { defineField, defineType } from 'sanity';

export const platform = defineType({
  name: 'platform',
  title: 'Platform',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Platform name from the WordPress platform taxonomy.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-safe identifier for platform references.',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'name',
    },
  },
});
