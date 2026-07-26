/**
 * campaignCta — Shared homepage / about / Vietnam “Campaign Brief” CTA block.
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair} from '../../lib/define-locale-pair'

export const campaignCta = defineType({
  name: 'campaignCta',
  title: 'Campaign CTA',
  type: 'object',

  fields: [
    ...defineLocalePair({
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 2,
      description: 'Supports <span class="vp-outline"> and <strong>.',
      optional: false,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'paragraphs',
      title: 'Paragraphs (English)',
      type: 'array',
      of: [{type: 'text', rows: 3}],
      description: 'Body paragraphs under the heading.',
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: 'paragraphsZh',
      title: 'Paragraphs (Chinese)',
      type: 'array',
      of: [{type: 'text', rows: 3}],
    }),

    ...defineLocalePair({
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
      optional: false,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'buttonHref',
      title: 'Button URL',
      type: 'string',
      description: 'Internal path or absolute URL. Default: /video-campaign-brief',
      initialValue: '/video-campaign-brief',
    }),
  ],
})
