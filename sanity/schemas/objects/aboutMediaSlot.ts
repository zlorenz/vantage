/**
 * aboutMediaSlot — Preview-capable media cell for About tabs / CTA rows.
 *
 * portfolioPreview: plays the portfolio entry's carousel clean clip (EN only;
 * ZH always shows the poster). customVideo: a Vimeo/YouTube URL that is not a
 * portfolio project (showreel edits). staticImage: still only.
 */

import {defineField, defineType} from 'sanity'
import {isEmbeddableVideoUrl} from '@video-url'

import {VimeoUrlInput} from '../../components/video/VimeoUrlInput'
import {defineLocalePair} from '../../lib/define-locale-pair'
import {hiddenForTranslator} from '../../lib/studio-roles'

type SlotParent = {
  mediaMode?: 'portfolioPreview' | 'customVideo' | 'staticImage'
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
          {title: 'Custom video (Vimeo/YouTube + poster)', value: 'customVideo'},
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
        (ctx.parent as SlotParent | undefined)?.mediaMode !== 'portfolioPreview',
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
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description:
        'Showreel or other clip that is not a portfolio project. Browse the Vimeo library or paste a Vimeo or YouTube URL. Plays in full (no in/out points). Poster is required below — ZH never loads Vimeo/YouTube.',
      hidden: (ctx) =>
        hiddenForTranslator(ctx) ||
        (ctx.parent as SlotParent | undefined)?.mediaMode !== 'customVideo',
      components: {input: VimeoUrlInput},
      validation: (rule) =>
        rule.uri({scheme: ['http', 'https']}).custom((value, context) => {
          const mode = (context.parent as SlotParent | undefined)?.mediaMode
          if (mode !== 'customVideo') return true
          if (!value || typeof value !== 'string') {
            return 'Paste a Vimeo or YouTube URL, or pick from the Vimeo library'
          }
          if (!isEmbeddableVideoUrl(value)) {
            return 'Enter a Vimeo or YouTube URL'
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
        'Required for static image and custom video. Optional poster override for a portfolio preview (recommended for China — ZH never loads Vimeo/YouTube).',
      hidden: hiddenForTranslator,
      validation: (rule) =>
        rule.custom((value, context) => {
          const mode = (context.parent as SlotParent | undefined)?.mediaMode
          if ((mode === 'staticImage' || mode === 'customVideo') && !value) {
            return 'Upload a poster / still image'
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
      videoUrl: 'videoUrl',
      portfolioTitle: 'portfolioEntry.title',
      portfolioImage: 'portfolioEntry.featuredImage',
    },
    prepare({mediaMode, alt, media, videoUrl, portfolioTitle, portfolioImage}) {
      if (mediaMode === 'staticImage') {
        return {
          title: alt?.trim() || 'Static image',
          subtitle: 'Static image',
          media,
        }
      }
      if (mediaMode === 'customVideo') {
        return {
          title: alt?.trim() || 'Custom video',
          subtitle: videoUrl || 'Custom video',
          media,
        }
      }
      return {
        title: portfolioTitle?.trim() || alt?.trim() || 'Portfolio preview',
        subtitle: 'Portfolio preview',
        media: media || portfolioImage,
      }
    },
  },
})
