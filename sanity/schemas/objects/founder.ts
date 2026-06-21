/**
 * founder — About page founder profile (also feeds JSON-LD).
 *
 * Source: content-schema.md §4.4 (page.founders array)
 */

import { defineField, defineType } from 'sanity';

export const founder = defineType({
  name: 'founder',
  title: 'Founder',
  type: 'object',

  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'jobTitle',
      title: 'Job Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'sameAs',
      title: 'Profile URLs',
      type: 'array',
      of: [{ type: 'url' }],
      description: 'Social/profile URLs for JSON-LD sameAs property.',
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'jobTitle',
      media: 'image',
    },
  },
});
