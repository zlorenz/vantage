/**
 * videoEvent — API-write-only playback / carousel analytics events.
 *
 * Created by the public-site analytics pipeline (not editorial content).
 * Omitted from Structure desk; Create blocked in sanity.config.ts.
 */

import {defineField, defineType} from 'sanity'

const MILESTONE_PERCENTS = [25, 50, 75, 90, 100] as const

/** Lock every field — documents are written via API only. */
const apiWriteOnly = {readOnly: true} as const

export const videoEvent = defineType({
  name: 'videoEvent',
  title: 'Video Event',
  type: 'document',
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          {title: 'View start', value: 'view_start'},
          {title: 'Milestone', value: 'milestone'},
          {title: 'Complete', value: 'complete'},
          {title: 'Click play', value: 'click_play'},
          {title: 'Impression', value: 'impression'},
          {title: 'Click through', value: 'click_through'},
        ],
      },
      validation: (rule) => rule.required(),
      ...apiWriteOnly,
    }),
    defineField({
      name: 'milestonePercent',
      title: 'Milestone Percent',
      type: 'number',
      options: {
        list: MILESTONE_PERCENTS.map((value) => ({title: `${value}%`, value})),
      },
      validation: (rule) =>
        rule.custom((value, context) => {
          if (value == null) return true
          const parent = context.parent as {eventType?: string}
          if (parent?.eventType !== 'milestone') {
            return 'Only set when event type is milestone'
          }
          if (!MILESTONE_PERCENTS.includes(value as (typeof MILESTONE_PERCENTS)[number])) {
            return 'Must be one of 25, 50, 75, 90, 100'
          }
          return true
        }),
      ...apiWriteOnly,
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      options: {
        list: [
          {title: 'Vimeo', value: 'vimeo'},
          {title: 'Native carousel', value: 'native_carousel'},
          {title: 'Xinpianchang', value: 'xinpianchang'},
          {title: 'YouTube', value: 'youtube'},
        ],
      },
      validation: (rule) => rule.required(),
      ...apiWriteOnly,
    }),
    defineField({
      name: 'videoId',
      title: 'Video ID',
      type: 'string',
      description: 'Vimeo ID, Xinpianchang mid, or YouTube video ID.',
      ...apiWriteOnly,
    }),
    defineField({
      name: 'portfolioEntryRef',
      title: 'Portfolio Entry',
      type: 'reference',
      to: [{type: 'portfolioEntry'}],
      weak: true,
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
