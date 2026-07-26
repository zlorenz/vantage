/**
 * client — Legacy WordPress Brand taxonomy document (orphaned).
 *
 * Source: content-schema.md §4.7
 * WordPress origin: `client` taxonomy
 *
 * Superseded by `creditIdentity` linked from Crew Credits → Brand.
 * `portfolioEntry.clients` was cleared in the 2026-07-22 retire pass; docs remain
 * in the dataset for historical reference only.
 *
 * Hidden from the Studio desk and blocked from Create (see structure.ts /
 * sanity.config.ts). Prefer creditIdentity for all new brand work.
 */

import {defineField, defineType} from 'sanity'

export const client = defineType({
  name: 'client',
  title: 'Clients (legacy)',
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
      description: 'URL-safe identifier used for historical filtering references.',
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
})
