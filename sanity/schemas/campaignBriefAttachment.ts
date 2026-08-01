/**
 * campaignBriefAttachment — Internal record of files uploaded with a campaign brief.
 *
 * Created by the campaign-brief API route so Lark notifications can link to CDN URLs.
 * Not editorial content — omitted from Structure desk (see structure.ts).
 */

import {defineField, defineType} from 'sanity'

export const campaignBriefAttachment = defineType({
  name: 'campaignBriefAttachment',
  title: 'Campaign Brief Attachment',
  type: 'document',
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: 'companyName',
      title: 'Company Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'campaignTitle',
      title: 'Campaign Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'campaignType',
      title: 'Campaign Type',
      type: 'string',
    }),
    defineField({
      name: 'files',
      title: 'Files',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'briefFile',
          fields: [
            defineField({
              name: 'file',
              title: 'File',
              type: 'file',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'originalFilename',
              title: 'Original Filename',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'originalFilename'},
          },
        },
      ],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: {
      title: 'campaignTitle',
      subtitle: 'companyName',
    },
  },
})
