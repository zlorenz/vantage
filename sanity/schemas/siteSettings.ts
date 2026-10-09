/**
 * siteSettings — Singleton global site configuration.
 *
 * Contact email/phone for footer + /contact. Organization for JSON-LD.
 * Social + default OG. Contact modal and campaign CTA blocks retired.
 */

import {defineField, defineType} from 'sanity'

import {hiddenForTranslator} from '../lib/studio-roles'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',

  groups: [
    {name: 'contact', title: 'Contact', default: true},
    {name: 'organization', title: 'Organization'},
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
        'Primary contact email in the footer and on /contact. ' +
        'WordPress default: info@vantage.pictures',
      validation: (rule) => rule.required().email(),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
      group: 'contact',
      description: 'Optional phone number in the footer and on /contact.',
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'legalName',
      title: 'Legal Name',
      type: 'string',
      group: 'organization',
      description:
        'Registered company name for Organization structured data (e.g. Top Boy Limited).',
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'foundingDate',
      title: 'Founding Date',
      type: 'date',
      group: 'organization',
      description: 'Company founding date for Organization structured data.',
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'numberOfEmployees',
      title: 'Number of Employees',
      type: 'object',
      group: 'organization',
      description:
        'Employee range for Organization structured data (schema.org QuantitativeValue).',
      fields: [
        defineField({
          name: 'minValue',
          title: 'Minimum',
          type: 'number',
          validation: (rule) => rule.min(0).integer(),
        }),
        defineField({
          name: 'maxValue',
          title: 'Maximum',
          type: 'number',
          validation: (rule) => rule.min(0).integer(),
        }),
      ],
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'socialVimeo',
      title: 'Vimeo URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'socialInstagram',
      title: 'Instagram URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'socialFacebook',
      title: 'Facebook URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'socialLinkedin',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'socialYoutube',
      title: 'YouTube URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'socialXinpianchang',
      title: 'Xinpianchang URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'socialXiaohongshu',
      title: 'Xiaohongshu URL',
      type: 'url',
      group: 'social',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'defaultOgImage',
      title: 'Default Open Graph Image',
      type: 'image',
      group: 'seo',
      options: {hotspot: true},
      hidden: hiddenForTranslator,
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
