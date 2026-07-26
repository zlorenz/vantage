/**
 * videoEmbed — First-class Vimeo/YouTube block for Portable Text bodies.
 *
 * Replaces the migration convention of a normal paragraph whose only text
 * is a video URL. Studio shows a real preview; the site renders the player.
 */

import {PlayIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {isEmbeddableVideoUrl, parseVideoUrl} from '@video-url'

import {VideoEmbedBlock} from '../../components/body/VideoEmbedBlock'
import {VideoEmbedInput} from '../../components/body/VideoEmbedInput'
import {VideoEmbedPreview} from '../../components/body/VideoEmbedPreview'

export const videoEmbed = defineType({
  name: 'videoEmbed',
  title: 'Video',
  type: 'object',
  icon: PlayIcon,
  components: {
    input: VideoEmbedInput,
    preview: VideoEmbedPreview,
    block: VideoEmbedBlock,
  },
  fields: [
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      description: 'Vimeo or YouTube URL. Prefer picking from portfolio when the film already exists.',
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value || typeof value !== 'string') return true
          if (!isEmbeddableVideoUrl(value)) {
            return 'Enter a Vimeo or YouTube URL'
          }
          return true
        }),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Shown in the editor preview. Filled from portfolio pick or oEmbed when available.',
    }),
  ],
  preview: {
    select: {url: 'url', title: 'title'},
    prepare({url, title}) {
      const parsed = typeof url === 'string' ? parseVideoUrl(url) : null
      if (!parsed) {
        return {title: title || 'Video', subtitle: url || 'Paste a Vimeo or YouTube URL'}
      }
      const provider = parsed.provider === 'vimeo' ? 'Vimeo' : 'YouTube'
      return {
        title: (typeof title === 'string' && title.trim()) || `${provider} video`,
        subtitle: provider,
        url,
      }
    },
  },
})
