/**
 * portableTextBody — Curated Portable Text for blog posts (reusable on pages later).
 *
 * Scoped to patterns used across live posts: headings, paragraphs, quotes,
 * lists, images, and video embeds. No galleries/CTAs/columns.
 *
 * Focus-compose UX is attached on the document field (`components.input`)
 * so TypeScript resolves PortableTextInputProps correctly.
 */

import {defineArrayMember, defineType} from 'sanity'

import {BodyImageBlock} from '../../components/body/BodyImageBlock'
import {VideoEmbedBlock} from '../../components/body/VideoEmbedBlock'

const textBlock = defineArrayMember({
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Heading 2', value: 'h2'},
    {title: 'Heading 3', value: 'h3'},
    {title: 'Heading 4', value: 'h4'},
    {title: 'Quote', value: 'blockquote'},
  ],
  lists: [
    {title: 'Bullet', value: 'bullet'},
    {title: 'Numbered', value: 'number'},
  ],
  marks: {
    decorators: [
      {title: 'Strong', value: 'strong'},
      {title: 'Emphasis', value: 'em'},
    ],
    annotations: [
      {
        name: 'link',
        type: 'object',
        title: 'Link',
        fields: [
          {
            name: 'href',
            type: 'url',
            title: 'URL',
            validation: (rule) =>
              rule.uri({
                allowRelative: true,
                scheme: ['http', 'https', 'mailto', 'tel'],
              }),
          },
        ],
      },
    ],
  },
})

const imageBlock = defineArrayMember({
  type: 'image',
  options: {hotspot: true},
  components: {
    block: BodyImageBlock,
  },
  fields: [
    {
      name: 'alt',
      type: 'string',
      title: 'Alt text override',
      description:
        'Optional. Overrides Media library Alt Text for this block only. Leave empty to use the asset default.',
    },
    {
      name: 'caption',
      type: 'string',
      title: 'Caption override',
      description:
        'Optional. Overrides Media library Description as the on-site caption for this block only.',
    },
  ],
})

const videoBlock = defineArrayMember({
  type: 'videoEmbed',
  components: {
    block: VideoEmbedBlock,
  },
})

/** Shared `of` members — also usable when extending page bodies later. */
export const portableTextBodyMembers = [textBlock, imageBlock, videoBlock]

export const portableTextBody = defineType({
  name: 'portableTextBody',
  title: 'Body',
  type: 'array',
  of: portableTextBodyMembers,
})
