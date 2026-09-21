/**
 * pullQuote — Blog body pull-quote with optional headshot + attribution.
 *
 * Distinct from the existing Portable Text `blockquote` style (kept for
 * legacy content). Named `pullQuote` to avoid colliding with that style.
 */

import {BlockquoteIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const pullQuote = defineType({
  name: 'pullQuote',
  title: 'Pull Quote',
  type: 'object',
  icon: BlockquoteIcon,
  fields: [
    defineField({
      name: 'text',
      title: 'Quote',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'attribution',
      title: 'Attribution',
      type: 'string',
      description: 'Optional name line (rendered as “– NAME”).',
    }),
    defineField({
      name: 'headshot',
      title: 'Headshot',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional. When set, shows beside the quote.',
    }),
  ],
  preview: {
    select: {
      title: 'text',
      subtitle: 'attribution',
      media: 'headshot',
    },
    prepare({title, subtitle, media}) {
      const quote =
        typeof title === 'string' && title.trim()
          ? title.trim().slice(0, 80)
          : 'Pull quote'
      return {
        title: quote,
        subtitle: subtitle || undefined,
        media,
      }
    },
  },
})
