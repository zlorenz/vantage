/**
 * siteSettings — Singleton global site configuration.
 *
 * Source: content-schema.md §4.5
 * WordPress origin: ACF Options page (Contact Info)
 *
 * There is exactly one siteSettings document in the dataset.
 * Singleton desk structure will be configured in sanity.config when all
 * schemas are registered.
 */

import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',

  fields: [
    // -------------------------------------------------------------------------
    // Contact information (footer, contact modal)
    // -------------------------------------------------------------------------

    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      description:
        'Primary contact email displayed in the footer and contact modal. ' +
        'WordPress default: info@vantage.pictures',
      validation: (rule) => rule.required().email(),
    }),

    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
      description: 'Optional phone number shown in the contact modal.',
    }),

    defineField({
      name: 'contactWhatsapp',
      title: 'Contact WhatsApp',
      type: 'string',
      description: 'Optional WhatsApp number or link for the contact modal.',
    }),

    defineField({
      name: 'contactAddress',
      title: 'Contact Address',
      type: 'text',
      rows: 3,
      description: 'Optional physical address shown in the contact modal.',
    }),

    // -------------------------------------------------------------------------
    // Contact modal content (nav "Contact" opens modal, not /contact/ page)
    // -------------------------------------------------------------------------

    defineField({
      name: 'contactModalTitle',
      title: 'Contact Modal Title',
      type: 'string',
      description:
        'Heading displayed inside the contact modal. Empty in production WordPress.',
    }),

    defineField({
      name: 'contactModalIntro',
      title: 'Contact Modal Intro',
      type: 'text',
      rows: 3,
      description:
        'Short introductory text above the contact modal body. Empty in production WordPress.',
    }),

    defineField({
      name: 'contactModalContent',
      title: 'Contact Modal Content',
      type: 'array',
      of: [{ type: 'block' }],
      description:
        'Rich text body content for the contact modal (Portable Text). ' +
        'Empty in production WordPress.',
    }),

    defineField({
      name: 'contactCtaText',
      title: 'Contact CTA Text',
      type: 'string',
      description:
        'Optional call-to-action button label in the contact modal. Empty in production WordPress.',
    }),

    defineField({
      name: 'contactCtaUrl',
      title: 'Contact CTA URL',
      type: 'url',
      description:
        'Optional call-to-action button link in the contact modal. Empty in production WordPress.',
      validation: (rule) =>
        rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
    }),

    // -------------------------------------------------------------------------
    // Social links (footer — empty field = hidden)
    // -------------------------------------------------------------------------

    defineField({
      name: 'socialVimeo',
      title: 'Vimeo URL',
      type: 'url',
      description: 'Vimeo profile link for the footer social icons.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'socialInstagram',
      title: 'Instagram URL',
      type: 'url',
      description: 'Instagram profile link for the footer social icons.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'socialFacebook',
      title: 'Facebook URL',
      type: 'url',
      description: 'Facebook profile link for the footer social icons.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'socialLinkedin',
      title: 'LinkedIn URL',
      type: 'url',
      description: 'LinkedIn profile link for the footer social icons.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'socialYoutube',
      title: 'YouTube URL',
      type: 'url',
      description: 'YouTube channel link for the footer social icons.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'socialXinpianchang',
      title: 'Xinpianchang URL',
      type: 'url',
      description: 'Xinpianchang (新片场) profile link for the footer social icons.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'socialXiaohongshu',
      title: 'Xiaohongshu URL',
      type: 'url',
      description:
        'Xiaohongshu (小红书) profile link. Empty = hidden in footer (per production behaviour).',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    // -------------------------------------------------------------------------
    // SEO / social defaults
    // -------------------------------------------------------------------------

    defineField({
      name: 'defaultOgImage',
      title: 'Default Open Graph Image',
      type: 'image',
      description:
        'Fallback OG image for pages without a per-entry image. ' +
        'WordPress default: vantage-pictures-default.jpg (attachment ID 3627).',
      options: {
        hotspot: true,
      },
    }),
  ],

  preview: {
    prepare() {
      return {
        title: 'Site Settings',
      };
    },
  },
});
