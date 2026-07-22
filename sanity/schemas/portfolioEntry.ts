/**
 * portfolioEntry — Portfolio project document.
 *
 * Source: content-schema.md §4.2
 * WordPress origin: `portfolio` CPT (141 entries)
 *
 * URL pattern: /portfolio/[slug]/ (EN), /zh/投资组合/[slugZh]/ (ZH)
 */

import { defineField, defineType } from 'sanity';

import { CrewCreditsInput } from '../components/crew-credits/CrewCreditsInput';
import { TaxonomyCheckboxInput } from '../components/TaxonomyCheckboxInput';

export const portfolioEntry = defineType({
  name: 'portfolioEntry',
  title: 'Portfolio',
  type: 'document',

  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'media', title: 'Media' },
    { name: 'taxonomies', title: 'Taxonomies' },
    { name: 'credits', title: 'Credits' },
    { name: 'seo', title: 'SEO' },
  ],

  fieldsets: [
    { name: 'titles', title: 'Titles', options: { columns: 2 } },
    { name: 'slugs', title: 'Slugs', options: { columns: 2 } },
    { name: 'displayTitles', title: 'Display Titles', options: { columns: 2 } },
    { name: 'copy', title: 'Description', options: { columns: 2 } },
    { name: 'videoUrls', title: 'Video URLs', options: { columns: 2 } },
    { name: 'taxonomy', title: 'Formats / Industries / Markets', options: { columns: 3 } },
    { name: 'people', title: 'Clients / Crew / Platforms', options: { columns: 3 } },
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      group: 'content',
      fieldset: 'titles',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
      group: 'content',
      fieldset: 'titles',
    }),

    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      group: 'content',
      fieldset: 'slugs',
      description: 'URL: /portfolio/[slug]/',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slugZh',
      title: 'Slug (Chinese)',
      type: 'slug',
      group: 'content',
      fieldset: 'slugs',
      description: 'URL: /zh/投资组合/[slug]/',
      options: { source: 'titleZh', maxLength: 96 },
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'content',
      description: 'Used for Work index and archive sort (newest first).',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'isHidden',
      title: 'Hidden from Public Portfolio',
      type: 'boolean',
      group: 'content',
      description: 'Excluded from public /work/ and market archives when true.',
      initialValue: false,
    }),

    defineField({
      name: 'thumbTitle',
      title: 'Thumbnail Title',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'displayTitles',
      description: 'Card overlay — supports HTML <br>.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'thumbTitleZh',
      title: 'Thumbnail Title (Chinese)',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'displayTitles',
    }),

    defineField({
      name: 'headerTitle',
      title: 'Header Title',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'displayTitles',
      description: 'Hero title — supports <span class="vp-outline">.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'headerTitleZh',
      title: 'Header Title (Chinese)',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'displayTitles',
    }),

    defineField({
      name: 'longTitle',
      title: 'Long Title',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'displayTitles',
      description: 'Main column title — supports <span class="vp-outline">.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'longTitleZh',
      title: 'Long Title (Chinese)',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'displayTitles',
    }),

    defineField({
      name: 'excerpt',
      title: 'Excerpt (English)',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'copy',
      description: 'Short teaser for hero carousel and cards.',
    }),

    defineField({
      name: 'excerptZh',
      title: 'Excerpt (Chinese)',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'copy',
    }),

    defineField({
      name: 'description',
      title: 'Description (English)',
      type: 'text',
      rows: 4,
      group: 'content',
      fieldset: 'copy',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'descriptionZh',
      title: 'Description (Chinese)',
      type: 'text',
      rows: 4,
      group: 'content',
      fieldset: 'copy',
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo URL',
      type: 'url',
      group: 'media',
      fieldset: 'videoUrls',
      validation: (rule) =>
        rule.required().uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'xinpianchangUrl',
      title: 'Xinpianchang URL',
      type: 'url',
      group: 'media',
      fieldset: 'videoUrls',
      description: 'Shown on /zh/ portfolio pages when set.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),

    defineField({
      name: 'additionalVideos',
      title: 'Additional Videos',
      type: 'array',
      group: 'media',
      of: [{ type: 'additionalVideo' }],
      description: 'Supplementary videos below the main player.',
    }),

    defineField({
      name: 'videoFormats',
      title: 'Video Formats',
      type: 'array',
      group: 'taxonomies',
      fieldset: 'taxonomy',
      of: [{ type: 'reference', to: [{ type: 'videoFormat' }] }],
      components: { input: TaxonomyCheckboxInput },
    }),

    defineField({
      name: 'industries',
      title: 'Industries',
      type: 'array',
      group: 'taxonomies',
      fieldset: 'taxonomy',
      of: [{ type: 'reference', to: [{ type: 'industry' }] }],
      components: { input: TaxonomyCheckboxInput },
    }),

    defineField({
      name: 'markets',
      title: 'Markets',
      type: 'array',
      group: 'taxonomies',
      fieldset: 'taxonomy',
      of: [{ type: 'reference', to: [{ type: 'market' }] }],
      components: { input: TaxonomyCheckboxInput },
    }),

    defineField({
      name: 'clients',
      title: 'Clients',
      type: 'array',
      group: 'taxonomies',
      fieldset: 'people',
      of: [{ type: 'reference', to: [{ type: 'client' }] }],
    }),

    defineField({
      name: 'crewMembers',
      title: 'Crew Members',
      type: 'array',
      group: 'taxonomies',
      fieldset: 'people',
      of: [{ type: 'reference', to: [{ type: 'crewMember' }] }],
    }),

    defineField({
      name: 'platforms',
      title: 'Platforms',
      type: 'array',
      group: 'taxonomies',
      fieldset: 'people',
      of: [{ type: 'reference', to: [{ type: 'platform' }] }],
    }),

    defineField({
      name: 'crewCredits',
      title: 'Crew Credits',
      type: 'array',
      group: 'credits',
      of: [{ type: 'crewCredit' }],
      description:
        'Download the CSV template, add crew credits via Claude, then upload and preview the import for confirming. All names must be comma-separated. Click a tag to edit the name or attach a link.',
      components: { input: CrewCreditsInput },
    }),

    defineField({
      name: 'credits',
      title: 'Legacy Credits',
      type: 'object',
      hidden: true,
      readOnly: true,
      description: 'Archived WordPress/ACF credits — kept in Sanity for reference; not shown in Studio.',
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

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoFields',
      group: 'seo',
    }),

    defineField({
      name: 'trash',
      type: 'trashMetadata',
      hidden: true,
      readOnly: true,
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
