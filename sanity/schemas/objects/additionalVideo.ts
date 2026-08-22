/**
 * additionalVideo — Supplementary video row on portfolio single pages.
 *
 * Video title is plain text (same pattern as portfolioEntry.heroFilmTitle).
 * Front-end composes Brand + Product + Campaign + outlined video title.
 */

import {defineType} from 'sanity'

import {TranslatorLockedArrayItem} from '../../components/TranslatorLockedArrayInput'
import {defineLocalePair} from '../../lib/define-locale-pair'

export const additionalVideo = defineType({
  name: 'additionalVideo',
  title: 'Additional Video',
  type: 'object',

  components: {
    item: TranslatorLockedArrayItem,
  },

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
        'Episode title for this video (same pattern as Hero Film Title). Displayed beside the player as Brand + Product + Campaign + this title (outlined).',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    ...defineLocalePair({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description:
        'Optional plain-text description. Use a blank line between paragraphs for separation on the site.',
      optional: true,
    }),
  ],

  preview: {
    select: {
      title: 'videoTitle',
      subtitle: 'vimeoUrl',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Additional video',
        subtitle,
      }
    },
  },
})
