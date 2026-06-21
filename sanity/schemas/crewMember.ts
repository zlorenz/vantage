/**
 * crewMember — Internal crew member document with role.
 *
 * Source: content-schema.md §4.8
 * WordPress origin: `director`, `dop`, `art-director` taxonomies (107 total)
 *
 * Referenced from portfolioEntry.crewMembers and credit fields
 * (prod_director, cam_dop, art_art_director). Used for /work-internal/ filtering.
 */

import { defineField, defineType } from 'sanity';

export const crewMember = defineType({
  name: 'crewMember',
  title: 'Crew Member',
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
      description: 'URL-safe identifier used for internal filtering references.',
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
          { title: 'Director', value: 'director' },
          { title: 'Director of Photography', value: 'dop' },
          { title: 'Art Director', value: 'art-director' },
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
    prepare({ title, role }) {
      const roleLabels: Record<string, string> = {
        director: 'Director',
        dop: 'DOP',
        'art-director': 'Art Director',
      };

      return {
        title: title || 'Untitled crew member',
        subtitle: role ? roleLabels[role] || role : undefined,
      };
    },
  },
});
