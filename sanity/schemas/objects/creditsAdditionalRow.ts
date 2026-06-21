/**
 * creditsAdditionalRow — Repeater row for extra credit roles.
 *
 * Source: content-schema.md §4.2 (credits department additional array)
 * WordPress origin: prod_additional, cam_additional, etc. ACF repeaters
 */

import { defineField, defineType } from 'sanity';

export const creditsAdditionalRow = defineType({
  name: 'creditsAdditionalRow',
  title: 'Additional Credit',
  type: 'object',

  fields: [
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'Credit role label (e.g. Creative Director, Catering).',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'names',
      title: 'Names',
      type: 'text',
      rows: 1,
      description: 'Comma-separated names for this role.',
      validation: (rule) => rule.required(),
    }),
  ],

  preview: {
    select: {
      role: 'role',
      names: 'names',
    },
    prepare({ role, names }) {
      return {
        title: role || 'Additional credit',
        subtitle: names,
      };
    },
  },
});
