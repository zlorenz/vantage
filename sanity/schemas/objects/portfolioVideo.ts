/**
 * portfolioVideo — One film on a portfolio entry.
 *
 * First item in portfolioEntry.videos is the main film; the rest are additional.
 * Carousel preview fields apply per row (homepage currently uses videos[0] only).
 */

import {defineField, defineType} from 'sanity'

import {OptionalField} from '../../components/OptionalField'
import {PreviewBoundsPairField} from '../../components/PreviewBoundsInput'
import {TranslatorLockedArrayItem} from '../../components/TranslatorLockedArrayInput'
import {VimeoUrlInput} from '../../components/video/VimeoUrlInput'
import {NullField} from '../../components/locale-pair/NullField'
import {defineLocalePair} from '../../lib/define-locale-pair'
import {hiddenForTranslator} from '../../lib/studio-roles'

export const portfolioVideo = defineType({
  name: 'portfolioVideo',
  title: 'Video',
  type: 'object',

  components: {
    item: TranslatorLockedArrayItem,
  },

  fieldsets: [
    {name: 'carouselPreview', title: 'Carousel Preview', options: {columns: 2}},
  ],

  fields: [
    ...defineLocalePair({
      name: 'vimeoUrl',
      zhName: 'xinpianchangUrl',
      title: 'Video URL',
      type: 'url',
      vimeoPicker: true,
      description:
        'Vimeo or YouTube (EN; YouTube only when Vimeo cannot host) · optional Xinpianchang on /zh/ pages.',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
      zhValidation: (rule) => rule.uri({scheme: ['http', 'https']}),
      optional: false,
      // Embed host URLs, not translation — editors upload to Xinpianchang.
      editorCanEditZh: true,
    }),

    ...defineLocalePair({
      name: 'videoTitle',
      title: 'Video Title',
      type: 'string',
      description:
        'Episode title. Optional on the main (first) film when it matches the Campaign Title; required on additional films.',
      optional: true,
    }),

    ...defineLocalePair({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description:
        'Optional plain-text description beside this player. Use a blank line between paragraphs for separation on the site.',
      optional: true,
    }),

    defineField({
      name: 'previewCleanVimeoUrl',
      title: 'Clean Preview Video URL',
      type: 'url',
      fieldset: 'carouselPreview',
      description:
        'Vimeo URL for clean export (no burned-in text/logos), for homepage carousel clips. Replaces this row’s master URL for carousel playback only — portfolio case pages always use the master Video URL.',
      hidden: hiddenForTranslator,
      components: {field: OptionalField, input: VimeoUrlInput},
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'previewStartSeconds',
      title: 'In and Out Points',
      type: 'number',
      fieldset: 'carouselPreview',
      description:
        'For the homepage carousel clip when this film is first in the Videos list. Leave empty to play the full video.',
      hidden: hiddenForTranslator,
      components: {field: PreviewBoundsPairField},
      validation: (rule) => rule.min(0),
    }),

    defineField({
      name: 'previewEndSeconds',
      title: 'End',
      type: 'number',
      // Omit fieldset so NullField does not consume a column in the 2-col row.
      hidden: hiddenForTranslator,
      components: {field: NullField},
      validation: (rule) =>
        rule.min(0).custom((end, context) => {
          const start = (
            context.parent as {previewStartSeconds?: number} | undefined
          )?.previewStartSeconds
          if (end == null || start == null) return true
          return end > start ? true : 'End must be greater than Start'
        }),
    }),
  ],

  preview: {
    select: {
      title: 'videoTitle',
      subtitle: 'vimeoUrl',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Video',
        subtitle,
      }
    },
  },
})
