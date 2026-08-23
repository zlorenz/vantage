/**
 * portfolioEntry — Portfolio project document.
 *
 * Source: content-schema.md §4.2
 * WordPress origin: `portfolio` CPT (141 entries)
 *
 * URL pattern: /portfolio/[slug]/ (EN), /zh/案例/[slugZh]/ (ZH)
 */

import {defineField, defineType} from 'sanity'

import {CrewCreditsInput} from '../components/crew-credits/CrewCreditsInput'
import {DisplayTitlesInput} from '../components/display-titles/DisplayTitlesInput'
import {OptionalField} from '../components/OptionalField'
import {PreviewBoundsPairField} from '../components/PreviewBoundsInput'
import {VimeoUrlInput} from '../components/video/VimeoUrlInput'
import {LocalePairHeadingField} from '../components/locale-pair/LocalePairHeadingField'
import {NullField} from '../components/locale-pair/NullField'
import {TaxonomyCheckboxInput} from '../components/TaxonomyCheckboxInput'
import {TranslatorLockedArrayInput} from '../components/TranslatorLockedArrayInput'
import {defineLocalePair, hiddenForTranslatorWhenEmpty} from '../lib/define-locale-pair'
import {hiddenForTranslator} from '../lib/studio-roles'

export const portfolioEntry = defineType({
  name: 'portfolioEntry',
  title: 'Portfolio',
  type: 'document',

  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'media', title: 'Media'},
    {name: 'credits', title: 'Credits'},
    {name: 'seo', title: 'SEO'},
  ],

  fieldsets: [
    // Untitled layout row (legend hidden via studio.css — Sanity auto-titles from name).
    {name: 'slugAndDate', options: {columns: 2}},
    {name: 'copy', title: 'Description', options: {columns: 2}},
    {name: 'taxonomy', title: 'Formats / Industries / Markets', options: {columns: 3}},
    {name: 'carouselPreview', title: 'Carousel Preview', options: {columns: 2}},
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      // Not readOnly: programmatic sync from Portfolio Details must be allowed.
      // The custom field renders heading text only (no editable input).
      options: {localePair: {zhName: 'titleZh'}} as never,
      components: {field: LocalePairHeadingField},
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
      group: 'content',
      components: {field: NullField},
    }),

    defineField({
      name: 'displayTitleParts',
      title: 'Campaign Details',
      type: 'object',
      group: 'content',
      components: {input: DisplayTitlesInput},
      fields: [
        defineField({
          name: 'brandName',
          title: 'Brand Name',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'productName',
          title: 'Product Name',
          type: 'string',
        }),
        defineField({
          name: 'campaignTitle',
          title: 'Campaign Title',
          type: 'string',
        }),
        defineField({
          name: 'brandNameZh',
          title: 'Brand Name (Chinese)',
          type: 'string',
        }),
        defineField({
          name: 'productNameZh',
          title: 'Product Name (Chinese)',
          type: 'string',
        }),
        defineField({
          name: 'campaignTitleZh',
          title: 'Campaign Title (Chinese)',
          type: 'string',
        }),
      ],
      validation: (rule) =>
        rule.custom((value) => {
          if (!value || typeof value !== 'object') {
            return 'Brand Name is required'
          }
          const brand = (value as {brandName?: string}).brandName?.trim()
          return brand ? true : 'Brand Name is required'
        }),
    }),

    ...defineLocalePair({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      fieldset: 'slugAndDate',
      description: 'EN: /portfolio/[slug]/ · ZH: /zh/案例/[slug]/',
      options: {source: 'title', maxLength: 96},
      zhOptions: {source: 'titleZh', maxLength: 96},
      validation: (rule) => rule.required(),
      optional: false,
    }),

    defineField({
      name: 'publishedAt',
      title: 'Original Release Date',
      type: 'date',
      group: 'content',
      fieldset: 'slugAndDate',
      description: "Client's original release day.",
      options: {dateFormat: 'YYYY-MM-DD'},
      validation: (rule) => rule.required(),
      hidden: hiddenForTranslator,
    }),

    // Display title HTML overrides — edited via Live preview pencil popovers (DisplayTitlesInput).
    defineField({
      name: 'thumbTitleOverride',
      title: 'Thumbnail Override',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: true,
    }),
    defineField({
      name: 'thumbTitleOverrideZh',
      title: 'Thumbnail Override (Chinese)',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: true,
    }),
    defineField({
      name: 'headerTitleOverride',
      title: 'Header Override',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: true,
    }),
    defineField({
      name: 'headerTitleOverrideZh',
      title: 'Header Override (Chinese)',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: true,
    }),
    defineField({
      name: 'longTitleOverride',
      title: 'Full Title Override',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: true,
    }),
    defineField({
      name: 'longTitleOverrideZh',
      title: 'Full Title Override (Chinese)',
      type: 'text',
      rows: 2,
      group: 'content',
      hidden: true,
    }),

    ...defineLocalePair({
      name: 'excerpt',
      title: 'Logline',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'copy',
      description: 'Quick summary for home carousel and portfolio headers.',
      optional: true,
    }),

    ...defineLocalePair({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      group: 'content',
      fieldset: 'copy',
      description: 'Displayed beside first video embed on the portfolio page.',
      optional: true,
    }),

    defineField({
      name: 'videoFormats',
      title: 'Video Formats',
      type: 'array',
      group: 'content',
      fieldset: 'taxonomy',
      of: [{ type: 'reference', to: [{ type: 'videoFormat' }] }],
      components: { input: TaxonomyCheckboxInput },
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'industries',
      title: 'Industries',
      type: 'array',
      group: 'content',
      fieldset: 'taxonomy',
      of: [{ type: 'reference', to: [{ type: 'industry' }] }],
      components: { input: TaxonomyCheckboxInput },
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'markets',
      title: 'Markets',
      type: 'array',
      group: 'content',
      fieldset: 'taxonomy',
      of: [{ type: 'reference', to: [{ type: 'market' }] }],
      components: { input: TaxonomyCheckboxInput },
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'isHidden',
      title: 'Hidden from Public Portfolio',
      type: 'boolean',
      group: 'content',
      description: 'Excluded from public /work/ and market archives when true.',
      initialValue: false,
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'media',
      options: {
        hotspot: {
          previews: [
            {title: 'Work Carousel (Desktop)', aspectRatio: 4 / 5},
            {title: 'Homepage Carousel', aspectRatio: 16 / 9},
          ],
        },
      },
      validation: (rule) => rule.required(),
      hidden: hiddenForTranslator,
    }),

    ...defineLocalePair({
      name: 'vimeoUrl',
      zhName: 'xinpianchangUrl',
      title: 'Video URL',
      type: 'url',
      group: 'media',
      vimeoPicker: true,
      description:
        'Vimeo or YouTube for English (YouTube only when Vimeo cannot host). Xinpianchang for Chinese.',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
      zhValidation: (rule) => rule.uri({scheme: ['http', 'https']}),
      optional: false,
      // Embed host URLs, not translation — editors upload to Xinpianchang.
      editorCanEditZh: true,
    }),

    defineField({
      name: 'previewCleanVimeoUrl',
      title: 'Clean Preview Video URL',
      type: 'url',
      group: 'media',
      fieldset: 'carouselPreview',
      description:
        'Vimeo URL for clean export (no burned-in text/logos), for carousel preview clips. This replaces the master video above for carousel playback only — single portfolio pages always use the master Video URL.',
      hidden: hiddenForTranslator,
      components: {field: OptionalField, input: VimeoUrlInput},
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'previewStartSeconds',
      title: 'In and Out Points',
      type: 'number',
      group: 'media',
      fieldset: 'carouselPreview',
      description:
        'For the homepage carousel clip. Leave empty to play the full video. Options are real keyframes when a Vimeo URL is set.',
      hidden: hiddenForTranslator,
      components: {field: PreviewBoundsPairField},
      validation: (rule) => rule.min(0),
    }),

    defineField({
      name: 'previewEndSeconds',
      title: 'End',
      type: 'number',
      group: 'media',
      // Omit fieldset so NullField does not consume a column in the 2-col row.
      // Stay in the form tree for editors (NullField) so sibling patches work.
      hidden: hiddenForTranslator,
      components: {field: NullField},
      validation: (rule) =>
        rule.min(0).custom((end, context) => {
          const start = (context.parent as {previewStartSeconds?: number} | undefined)
            ?.previewStartSeconds
          if (end == null || start == null) return true
          return end > start ? true : 'End must be greater than Start'
        }),
    }),

    ...defineLocalePair({
      name: 'heroFilmTitle',
      title: 'Hero Film Title',
      type: 'string',
      group: 'media',
      description:
        'Only use if different from Campaign Title, typically for multi-video campaigns.',
    }),

    defineField({
      name: 'additionalVideos',
      title: 'Additional Videos',
      type: 'array',
      group: 'media',
      of: [{type: 'additionalVideo'}],
      description: 'Supplementary videos below the main player.',
      hidden: hiddenForTranslatorWhenEmpty,
      components: {input: TranslatorLockedArrayInput},
    }),

    defineField({
      name: 'clients',
      title: 'Clients (legacy)',
      type: 'array',
      group: 'content',
      hidden: true,
      readOnly: true,
      description:
        'Legacy Brand taxonomy refs. Prefer creditIdentity links on Crew Credits → Brand. Kept for historical data.',
      of: [{ type: 'reference', to: [{ type: 'client' }] }],
    }),

    defineField({
      name: 'crewMembers',
      title: 'Crew Members (legacy)',
      type: 'array',
      group: 'content',
      hidden: true,
      readOnly: true,
      description:
        'Legacy Director / DOP / Art Director taxonomy refs. Prefer creditIdentity links on Crew Credits. Kept for historical data.',
      of: [{ type: 'reference', to: [{ type: 'crewMember' }] }],
    }),

    defineField({
      name: 'platforms',
      title: 'Platforms',
      type: 'array',
      group: 'content',
      hidden: true,
      readOnly: true,
      description: 'Legacy field — not used. Kept on documents for historical data only.',
      of: [{ type: 'reference', to: [{ type: 'platform' }] }],
    }),

    defineField({
      name: 'crewCredits',
      title: 'Crew Credits',
      type: 'array',
      group: 'credits',
      of: [{ type: 'crewCredit' }],
      description:
        'Download the CSV template, add crew credits via Claude, then upload and preview the import for confirming. All names must be comma-separated. Click a tag to edit the name or attach a link. Brand / Director / DOP / Art Director / Editor names link to stable Credit Identities for Work Library filters.',
      components: { input: CrewCreditsInput },
      hidden: hiddenForTranslator,
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
