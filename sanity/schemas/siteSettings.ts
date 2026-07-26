/**
 * siteSettings — Singleton global site configuration.
 *
 * Source: content-schema.md §4.5
 * WordPress origin: ACF Options page (Contact Info)
 */

import {defineField, defineType} from 'sanity'

import {defineLocalePair, hideZhPortableText} from '../lib/define-locale-pair'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',

  groups: [
    {name: 'contact', title: 'Contact', default: true},
    {name: 'cta', title: 'Campaign CTA'},
    {name: 'social', title: 'Social'},
    {name: 'seo', title: 'SEO'},
  ],

  fields: [
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      group: 'contact',
      description:
        'Primary contact email displayed in the footer and contact modal. ' +
        'WordPress default: info@vantage.pictures',
      validation: (rule) => rule.required().email(),
    }),

    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
      group: 'contact',
      description: 'Optional phone number shown in the contact modal.',
    }),

    defineField({
      name: 'contactWhatsapp',
      title: 'Contact WhatsApp',
      type: 'string',
      group: 'contact',
      description: 'Optional WhatsApp number or link for the contact modal.',
    }),

    ...defineLocalePair({
      name: 'contactAddress',
      title: 'Contact Address',
      type: 'text',
      rows: 3,
      group: 'contact',
      description: 'Optional physical address shown in the contact modal.',
      optional: true,
    }),

    ...defineLocalePair({
      name: 'contactModalTitle',
      title: 'Contact Modal Title',
      type: 'string',
      group: 'contact',
      description: 'Heading displayed inside the contact modal.',
      optional: true,
    }),

    ...defineLocalePair({
      name: 'contactModalIntro',
      title: 'Contact Modal Intro',
      type: 'text',
      rows: 3,
      group: 'contact',
      description: 'Short introductory text above the contact modal body.',
      optional: true,
    }),

    defineField({
      name: 'contactModalContent',
      title: 'Contact Modal Content (English)',
      type: 'array',
      of: [{type: 'block'}],
      group: 'contact',
      description: 'Rich text body content for the contact modal (Portable Text).',
    }),

    defineField({
      name: 'contactModalContentZh',
      title: 'Contact Modal Content (Chinese)',
      type: 'array',
      of: [{type: 'block'}],
      group: 'contact',
      hidden: hideZhPortableText('contactModalContent'),
    }),

    ...defineLocalePair({
      name: 'contactCtaText',
      title: 'Contact CTA Text',
      type: 'string',
      group: 'contact',
      description: 'Optional call-to-action button label in the contact modal.',
      optional: true,
    }),

    defineField({
      name: 'contactCtaUrl',
      title: 'Contact CTA URL',
      type: 'url',
      group: 'contact',
      description: 'Optional call-to-action button link in the contact modal.',
      validation: (rule) =>
        rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
    }),

    defineField({
      name: 'campaignCta',
      title: 'Campaign Brief CTA',
      type: 'campaignCta',
      group: 'cta',
      description:
        'Shared CTA block on Home, About, and Vietnam Production Service. Button usually links to the Campaign Brief form.',
    }),

    defineField({
      name: 'socialVimeo',
      title: 'Vimeo URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'socialInstagram',
      title: 'Instagram URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'socialFacebook',
      title: 'Facebook URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'socialLinkedin',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'socialYoutube',
      title: 'YouTube URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'socialXinpianchang',
      title: 'Xinpianchang URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'socialXiaohongshu',
      title: 'Xiaohongshu URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'defaultOgImage',
      title: 'Default Open Graph Image',
      type: 'image',
      group: 'seo',
      options: {hotspot: true},
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
