/**
 * trashMetadata — Hidden soft-delete state on portfolio/blog/page documents.
 */

import {defineField, defineType} from 'sanity'

export const trashMetadata = defineType({
  name: 'trashMetadata',
  title: 'Trash',
  type: 'object',
  fields: [
    defineField({
      name: 'trashedAt',
      title: 'Trashed At',
      type: 'datetime',
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
    }),
    defineField({
      name: 'batchId',
      title: 'Batch ID',
      type: 'string',
    }),
  ],
})
