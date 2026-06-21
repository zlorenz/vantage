/**
 * pdfDownload — file download block for pages (e.g. Vietnam Location Guide).
 *
 * Source: content-schema.md §2.2 File Block
 */

import { defineField, defineType } from 'sanity';

export const pdfDownload = defineType({
  name: 'pdfDownload',
  title: 'PDF Download',
  type: 'object',

  fields: [
    defineField({
      name: 'file',
      title: 'PDF File',
      type: 'file',
      options: { accept: 'application/pdf' },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'label',
      title: 'Filename Label',
      type: 'string',
      description: 'Display filename shown beside the download button.',
      validation: (rule) => rule.required(),
    }),
  ],

  preview: {
    select: { title: 'label' },
  },
});
