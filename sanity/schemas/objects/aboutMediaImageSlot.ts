/**
 * aboutMediaImageSlot — Still-only media cell for About statement chrome
 * (inline markers + film strips). No video playback.
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair} from '../../lib/define-locale-pair'
import {hiddenForTranslator} from '../../lib/studio-roles'

type SlotParent = {
  mediaMode?: 'portfolio' | 'staticImage'
}

export const aboutMediaImageSlot = defineType({
  name: 'aboutMediaImageSlot',
  title: 'About Image Slot',
  type: 'object',

  fields: [
    defineField({
      name: 'mediaMode',
      title: 'Image Source',
      type: 'string',
      initialValue: 'portfolio',
      options: {
        list: [
          {title: 'Portfolio featured image', value: 'portfolio'},
          {title: 'Uploaded image', value: 'staticImage'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'portfolioEntry',
      title: 'Portfolio Entry',
      type: 'reference',
      to: [{type: 'portfolioEntry'}],
      description: "Uses that project's featured image only (no video on statement chrome).",
      hidden: (ctx) =>
        hiddenForTranslator(ctx) ||
        (ctx.parent as SlotParent | undefined)?.mediaMode === 'staticImage',
      validation: (rule) =>
        rule.custom((value, context) => {
          const mode = (context.parent as SlotParent | undefined)?.mediaMode
          if (mode === 'portfolio' && !value) {
            return 'Pick a portfolio entry'
          }
          return true
        }),
    }),

    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      description:
        'Required for uploaded mode. Optional crop override when using a portfolio featured image.',
      hidden: hiddenForTranslator,
      validation: (rule) =>
        rule.custom((value, context) => {
          const mode = (context.parent as SlotParent | undefined)?.mediaMode
          if (mode === 'staticImage' && !value) {
            return 'Upload an image'
          }
          return true
        }),
    }),

    ...defineLocalePair({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      description: 'Accessibility text for the still.',
      optional: true,
    }),
  ],

  preview: {
    select: {
      mediaMode: 'mediaMode',
      alt: 'alt',
      media: 'image',
      portfolioTitle: 'portfolioEntry.title',
      portfolioImage: 'portfolioEntry.featuredImage',
    },
    prepare({mediaMode, alt, media, portfolioTitle, portfolioImage}) {
      const isStatic = mediaMode === 'staticImage'
      return {
        title: isStatic
          ? alt?.trim() || 'Uploaded image'
          : portfolioTitle?.trim() || alt?.trim() || 'Portfolio still',
        subtitle: isStatic ? 'Uploaded image' : 'Portfolio featured image',
        media: media || portfolioImage,
      }
    },
  },
})
