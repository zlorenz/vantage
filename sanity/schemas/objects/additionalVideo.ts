/**
 * additionalVideo — Supplementary video row on portfolio single pages.
 *
 * Source: content-schema.md §4.2 (additionalVideos array)
 */

import { defineField, defineType } from 'sanity';

export const additionalVideo = defineType({
  name: 'additionalVideo',
  title: 'Additional Video',
  type: 'object',

  fields: [
    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo URL',
      type: 'url',
      description: 'Vimeo video URL (English and default locale).',
      validation: (rule) =>
        rule.required().uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'xinpianchangUrl',
      title: 'Xinpianchang URL',
      type: 'url',
      description: 'Optional Xinpianchang URL shown on Chinese (/zh/) portfolio pages.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'longTitle',
      title: 'Title',
      type: 'text',
      rows: 2,
      description: 'Video title — supports HTML <span> for .vp-outline styling.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Optional video description.',
    }),
  ],

  preview: {
    select: {
      title: 'longTitle',
      subtitle: 'vimeoUrl',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Additional video',
        subtitle,
      };
    },
  },
});
