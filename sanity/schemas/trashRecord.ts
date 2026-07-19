/**
 * trashRecord — Internal audit/recovery document for soft-deleted content.
 *
 * Stores IDs as strings (never strong references) so permanent deletion is not blocked.
 * Holds backups of removed inbound references and prior schedule metadata for restore.
 */

import {defineField, defineType} from 'sanity'

export const trashRecord = defineType({
  name: 'trashRecord',
  title: 'Trash Record',
  type: 'document',
  // Keep out of Structure; Content tool Trash view owns this lifecycle.
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: 'targetId',
      title: 'Target Published ID',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'targetType',
      title: 'Target Type',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'trashedAt',
      title: 'Trashed At',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'trashedBy',
      title: 'Trashed By',
      type: 'string',
    }),
    defineField({
      name: 'purgeAfter',
      title: 'Purge After',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'batchId',
      title: 'Batch ID',
      type: 'string',
    }),
    defineField({
      name: 'schedule',
      title: 'Prior Schedule',
      type: 'object',
      fields: [
        defineField({name: 'releaseId', type: 'string', title: 'Release ID'}),
        defineField({name: 'publishAt', type: 'datetime', title: 'Publish At'}),
      ],
    }),
    defineField({
      name: 'removedReferences',
      title: 'Removed References',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'referrerId', type: 'string', title: 'Referrer Document ID'}),
            defineField({
              name: 'referrerPublishedId',
              type: 'string',
              title: 'Referrer Published ID',
            }),
            defineField({name: 'referrerType', type: 'string', title: 'Referrer Type'}),
            defineField({name: 'referrerTitle', type: 'string', title: 'Referrer Title'}),
            defineField({name: 'path', type: 'string', title: 'Field Path'}),
            defineField({
              name: 'kind',
              type: 'string',
              title: 'Kind',
              options: {
                list: [
                  {title: 'Array item', value: 'arrayItem'},
                  {title: 'Array reference', value: 'arrayReference'},
                  {title: 'Reference field', value: 'referenceField'},
                ],
              },
            }),
            defineField({name: 'itemKey', type: 'string', title: 'Item Key'}),
            defineField({
              name: 'valueJson',
              type: 'text',
              title: 'Removed Value (JSON)',
              rows: 3,
            }),
          ],
          preview: {
            select: {title: 'referrerTitle', subtitle: 'path'},
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'targetType',
      trashedAt: 'trashedAt',
    },
    prepare({title, subtitle, trashedAt}) {
      return {
        title: title || 'Untitled',
        subtitle: [
          subtitle,
          trashedAt ? new Date(trashedAt).toLocaleDateString() : null,
        ]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
