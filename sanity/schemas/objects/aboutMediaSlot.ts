/**
 * aboutMediaSlot — Preview-capable media cell for About tabs / CTA rows.
 *
 * portfolioPreview: plays the portfolio entry's carousel clean clip (EN only;
 * ZH always shows the poster). staticImage: still only.
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair} from '../../lib/define-locale-pair'
import {hiddenForTranslator} from '../../lib/studio-roles'

type SlotParent = {
  mediaMode?: 'portfolioPreview' | 'staticImage'
}

export const aboutMediaSlot = defineType({
  name: 'aboutMediaSlot',
  title: 'About Media Slot',
  type: 'object',

  fields: [
    defineField({
      name: 'mediaMode',
      title: 'Media',
      type: 'string',
      initialValue: 'portfolioPreview',
      options: {
        list: [
          {title: 'Portfolio preview (video + poster)', value: 'portfolioPreview'},
          {title: 'Static image only', value: 'staticImage'},
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
      description:
        "Preview uses that project's carousel clean clip. Poster defaults to its featured image unless you upload an override below.",
      hidden: (ctx) =>
        hiddenForTranslator(ctx) ||
        (ctx.parent as SlotParent | undefined)?.mediaMode === 'staticImage',
      validation: (rule) =>
        rule.custom((value, context) => {
          const mode = (context.parent as SlotParent | undefined)?.mediaMode
          if (mode === 'portfolioPreview' && !value) {
            return 'Pick a portfolio entry for preview mode'
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
        'Required for static image mode. Optional poster override when using a portfolio preview (recommended for China — ZH never loads Vimeo).',
      hidden: hiddenForTranslator,
      validation: (rule) =>
        rule.custom((value, context) => {
          const mode = (context.parent as SlotParent | undefined)?.mediaMode
          if (mode === 'staticImage' && !value) {
            return 'Upload an image for static mode'
          }
          return true
        }),
    }),

    ...defineLocalePair({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      description: 'Accessibility text for the poster / static image.',
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
          ? alt?.trim() || 'Static image'
          : portfolioTitle?.trim() || alt?.trim() || 'Portfolio preview',
        subtitle: isStatic ? 'Static image' : 'Portfolio preview',
        media: media || portfolioImage,
      }
    },
  },
})
