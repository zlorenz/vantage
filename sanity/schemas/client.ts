/**
 * client — Internal client taxonomy document.
 *
 * Source: content-schema.md §4.7
 * WordPress origin: `client` taxonomy (67 terms)
 *
 * Referenced from portfolioEntry.clients and credits.prod_brand.
 * Used for /work-internal/ filtering — not exposed on public taxonomy archives.
 */

import { defineField, defineType } from 'sanity';

export const client = defineType({
  name: 'client',
  title: 'Client',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Client / brand name from the WordPress client taxonomy.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-safe identifier used for internal filtering references.',
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
