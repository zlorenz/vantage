/**
 * imagePair — Exactly two side-by-side images for blog Portable Text bodies.
 *
 * Blog-body only. Does not replace or collide with page `imageGallery`.
 * Per-image alt/caption fields match portableTextBody imageBlock overrides.
 */

import {ImagesIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

const imageSlotFields = [
  {
    name: 'alt',
    type: 'string' as const,
    title: 'Alt text override',
    description:
      'Optional. Overrides Media library Alt Text for this block only. Leave empty to use the asset default.',
  },
  {
    name: 'caption',
    type: 'string' as const,
    title: 'Caption override',
    description:
      'Optional. Overrides Media library Description as the on-site caption for this block only.',
  },
]

export const imagePair = defineType({
  name: 'imagePair',
  title: 'Image Pair',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'left',
      title: 'Left image',
      type: 'image',
      options: {hotspot: true},
      fields: imageSlotFields,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'right',
      title: 'Right image',
      type: 'image',
      options: {hotspot: true},
      fields: imageSlotFields,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      left: 'left',
      right: 'right',
      leftCaption: 'left.caption',
      rightCaption: 'right.caption',
    },
    prepare({left, leftCaption, rightCaption}) {
      const parts = [leftCaption, rightCaption].filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0,
      )
      return {
        title: 'Image pair',
        subtitle: parts.length ? parts.join(' · ') : 'Two images',
        media: left,
      }
    },
  },
})
