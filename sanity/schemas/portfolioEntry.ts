/**
 * portfolioEntry — Portfolio project document.
 *
 * Source: content-schema.md §4.2
 * WordPress origin: `portfolio` CPT (141 entries)
 *
 * URL pattern: /portfolio/[slug]/ (EN), /zh/投资组合/[slugZh]/ (ZH)
 */

import { defineField, defineType } from 'sanity';

export const portfolioEntry = defineType({
  name: 'portfolioEntry',
  title: 'Portfolio Entry',
  type: 'document',

  fields: [
    // -------------------------------------------------------------------------
    // Titles — English and Chinese
    // -------------------------------------------------------------------------

    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      description: 'Canonical post title (WordPress post_title).',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
      description: 'Chinese title from TranslatePress.',
    }),

    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      description: 'URL slug for /portfolio/[slug]/. Must match live URLs for SEO.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slugZh',
      title: 'Slug (Chinese)',
      type: 'slug',
      description:
        'Chinese URL slug for /zh/投资组合/[slug]/. Stored explicitly — not derived from English.',
      options: { source: 'titleZh', maxLength: 96 },
    }),

    // -------------------------------------------------------------------------
    // Display titles — HTML allowed (<br>, <span class="vp-outline">)
    // -------------------------------------------------------------------------

    defineField({
      name: 'thumbTitle',
      title: 'Thumbnail Title',
      type: 'text',
      rows: 2,
      description:
        'Card overlay title — supports HTML <br>. All 141 WordPress entries populated.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'headerTitle',
      title: 'Header Title',
      type: 'text',
      rows: 2,
      description:
        'Hero display title — supports HTML <span> for .vp-outline styling.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'longTitle',
      title: 'Long Title',
      type: 'text',
      rows: 2,
      description:
        'Main column title — supports HTML <span> for .vp-outline styling.',
      validation: (rule) => rule.required(),
    }),

    // -------------------------------------------------------------------------
    // Description
    // -------------------------------------------------------------------------

    defineField({
      name: 'description',
      title: 'Description (English)',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'descriptionZh',
      title: 'Description (Chinese)',
      type: 'text',
      rows: 5,
    }),

    // -------------------------------------------------------------------------
    // Media
    // -------------------------------------------------------------------------

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo URL',
      type: 'url',
      description: 'Primary Vimeo embed URL. Vimeo ID extracted at render time.',
      validation: (rule) =>
        rule.required().uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'xinpianchangUrl',
      title: 'Xinpianchang URL',
      type: 'url',
      description: 'Optional — shown on /zh/ portfolio pages when set (72 entries in WP).',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'additionalVideos',
      title: 'Additional Videos',
      type: 'array',
      of: [{ type: 'additionalVideo' }],
      description: 'Supplementary videos below main player (28 WordPress entries have rows).',
    }),

    // -------------------------------------------------------------------------
    // Taxonomy references
    // -------------------------------------------------------------------------

    defineField({
      name: 'videoFormats',
      title: 'Video Formats',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'videoFormat' }] }],
    }),

    defineField({
      name: 'industries',
      title: 'Industries',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'industry' }] }],
    }),

    defineField({
      name: 'markets',
      title: 'Markets',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'market' }] }],
    }),

    defineField({
      name: 'clients',
      title: 'Clients',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'client' }] }],
      description: 'Synced from prod_brand credits during migration.',
    }),

    defineField({
      name: 'crewMembers',
      title: 'Crew Members',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'crewMember' }] }],
      description: 'Synced from director/dop/art-director credits during migration.',
    }),

    defineField({
      name: 'platforms',
      title: 'Platforms',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'platform' }] }],
    }),

    // -------------------------------------------------------------------------
    // Visibility — consolidated from portfolio_visibility taxonomy (§4.11)
    // -------------------------------------------------------------------------

    defineField({
      name: 'isHidden',
      title: 'Hidden from Public Portfolio',
      type: 'boolean',
      description:
        'When true, excluded from public /work/ and market archives. ' +
        'Migration: set true for WP ID 3187 (Bitget – Elite Traders) only.',
      initialValue: false,
    }),

    // -------------------------------------------------------------------------
    // Credits — department-grouped (WordPress ACF Portfolio Credits)
    // -------------------------------------------------------------------------

    defineField({
      name: 'credits',
      title: 'Credits',
      type: 'object',
      description: 'Department-grouped credits from WordPress ACF Portfolio Credits.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'production',
          title: 'Production',
          type: 'productionCredits',
        }),
        defineField({
          name: 'camera',
          title: 'Camera',
          type: 'cameraCredits',
        }),
        defineField({
          name: 'ge',
          title: 'G&E',
          type: 'geCredits',
        }),
        defineField({
          name: 'art',
          title: 'Art',
          type: 'artCredits',
        }),
        defineField({
          name: 'casting',
          title: 'Casting',
          type: 'castingCredits',
        }),
        defineField({
          name: 'stills',
          title: 'Stills',
          type: 'stillsCredits',
        }),
        defineField({
          name: 'post',
          title: 'Post',
          type: 'postCredits',
        }),
      ],
    }),

    // -------------------------------------------------------------------------
    // SEO
    // -------------------------------------------------------------------------

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoFields',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'titleZh',
      media: 'featuredImage',
      isHidden: 'isHidden',
    },
    prepare({ title, subtitle, media, isHidden }) {
      return {
        title: isHidden ? `[Hidden] ${title}` : title,
        subtitle,
        media,
      };
    },
  },
});
