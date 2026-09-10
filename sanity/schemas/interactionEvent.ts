/**
 * interactionEvent — API-write-only search / filter analytics events.
 *
 * Created by the public-site analytics pipeline (not editorial content).
 * Omitted from Structure desk; Create blocked in sanity.config.ts.
 */

import {defineField, defineType} from 'sanity'

/** Lock every field — documents are written via API only. */
const apiWriteOnly = {readOnly: true} as const

export const interactionEvent = defineType({
  name: 'interactionEvent',
  title: 'Interaction Event',
  type: 'document',
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          {title: 'Search submit', value: 'search_submit'},
          {title: 'Filter change', value: 'filter_change'},
          {title: 'Result click', value: 'result_click'},
        ],
      },
      validation: (rule) => rule.required(),
      ...apiWriteOnly,
    }),
    defineField({
      name: 'sourceSurface',
      title: 'Source Surface',
      type: 'string',
      options: {
        list: [
          {title: 'Nav search', value: 'nav_search'},
          {title: 'Work carousel', value: 'work_carousel'},
          {title: 'Taxonomy archive', value: 'taxonomy_archive'},
          {title: 'Search page', value: 'search_page'},
        ],
      },
      validation: (rule) => rule.required(),
      ...apiWriteOnly,
    }),
    defineField({
      name: 'query',
      title: 'Query',
      type: 'string',
      ...apiWriteOnly,
    }),
    defineField({
      name: 'filters',
      title: 'Filters',
      type: 'object',
      fields: [
        defineField({name: 'format', type: 'string', title: 'Format', ...apiWriteOnly}),
        defineField({name: 'industry', type: 'string', title: 'Industry', ...apiWriteOnly}),
        defineField({name: 'market', type: 'string', title: 'Market', ...apiWriteOnly}),
      ],
      ...apiWriteOnly,
    }),
    defineField({
      name: 'resultSlug',
      title: 'Result Slug',
      type: 'string',
      ...apiWriteOnly,
    }),
    defineField({
      name: 'resultType',
      title: 'Result Type',
      type: 'string',
      options: {
        list: [
          {title: 'Portfolio', value: 'portfolio'},
          {title: 'News', value: 'news'},
        ],
      },
      ...apiWriteOnly,
    }),
    defineField({
      name: 'pagePath',
      title: 'Page Path',
      type: 'string',
      validation: (rule) => rule.required(),
      ...apiWriteOnly,
    }),
    defineField({
      name: 'locale',
      title: 'Locale',
      type: 'string',
      validation: (rule) => rule.required(),
      ...apiWriteOnly,
    }),
    defineField({
      name: 'sessionId',
      title: 'Session ID',
      type: 'string',
      validation: (rule) => rule.required(),
      ...apiWriteOnly,
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (rule) => rule.required(),
      ...apiWriteOnly,
    }),
  ],
})
