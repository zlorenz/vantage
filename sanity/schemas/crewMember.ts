/**
 * crewMember — Legacy WordPress role-scoped crew taxonomy document (orphaned).
 *
 * Source: content-schema.md §4.8
 * WordPress origin: `director`, `dop`, `art-director` taxonomies
 *
 * Superseded by `creditIdentity` (one vendor across roles) linked from Crew Credits.
 * `portfolioEntry.crewMembers` was cleared in the 2026-07-22 retire pass; docs remain
 * in the dataset for historical reference only.
 *
 * Hidden from the Studio desk and blocked from Create (see structure.ts /
 * sanity.config.ts). Prefer creditIdentity for all new crew work.
 */

import {defineField, defineType} from 'sanity'

export const crewMember = defineType({
  name: 'crewMember',
  title: 'Crew Members (legacy)',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Crew member name from the WordPress crew taxonomies.',
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

    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description:
        'Crew discipline — maps to WordPress director, dop, or art-director taxonomy.',
      options: {
        list: [
          {title: 'Director', value: 'director'},
          {title: 'Director of Photography', value: 'dop'},
          {title: 'Art Director', value: 'art-director'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'name',
      role: 'role',
    },
    prepare({title, role}) {
      const roleLabels: Record<string, string> = {
        director: 'Director',
        dop: 'DOP',
        'art-director': 'Art Director',
      }

      return {
        title: title || 'Untitled crew member',
        subtitle: role ? roleLabels[role] || role : undefined,
      }
    },
  },
})
