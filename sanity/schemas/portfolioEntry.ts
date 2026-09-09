/**
 * portfolioEntry — Portfolio project document.
 *
 * Source: content-schema.md §4.2
 * WordPress origin: `portfolio` CPT (141 entries)
 *
 * URL pattern: /portfolio/[slug]/ (EN), /zh/案例/[slugZh]/ (ZH)
 */

import {defineField, defineType} from 'sanity'
import {createElement, useEffect} from 'react'
import {AutoTagInput} from 'sanity-plugin-media'
import {useClient, type ObjectInputProps, type PreviewValue} from 'sanity'
import {ensureKeyVisualTag, KEY_VISUAL_TAG_NAME} from '@media-tags'
import {isKeyVisualVideoFormatId, KEY_VISUAL_VIDEO_FORMAT_ID} from '@video-formats'

import {CrewCreditsInput} from '../components/crew-credits/CrewCreditsInput'
import {DisplayTitlesInput} from '../components/display-titles/DisplayTitlesInput'
import {FeaturedImageHotspotInput} from '../components/featured-image/FeaturedImageHotspotInput'
import {OptionalField} from '../components/OptionalField'
import {PreviewBoundsPairField} from '../components/PreviewBoundsInput'
import {VimeoUrlInput} from '../components/video/VimeoUrlInput'
import {LocalePairHeadingField} from '../components/locale-pair/LocalePairHeadingField'
import {NullField} from '../components/locale-pair/NullField'
import {TaxonomyCheckboxInput} from '../components/TaxonomyCheckboxInput'
import {TranslatorLockedArrayInput} from '../components/TranslatorLockedArrayInput'
import {
  KeyVisualsArrayInput,
  KeyVisualPreview,
} from '../components/KeyVisualsArrayInput'
import {defineLocalePair, hiddenForTranslatorWhenEmpty} from '../lib/define-locale-pair'
import {hiddenForTranslator} from '../lib/studio-roles'

/** Ensures tag doc exists; AutoTagInput tags single-item selects — bulk tagging is handled by the key-visual-tag Sanity Function. */
function KeyVisualImageInput(props: ObjectInputProps) {
  const client = useClient({apiVersion: '2024-01-01'})
  useEffect(() => {
    // Studio bundles @sanity/client v8; shared helpers type against v7 — same cast as DocumentEditor.
    void ensureKeyVisualTag(
      client as unknown as Parameters<typeof ensureKeyVisualTag>[0],
    )
  }, [client])
  return createElement(AutoTagInput, {
    ...props,
    mediaTags: [KEY_VISUAL_TAG_NAME],
  })
}

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
    // Untitled: Title | Hidden toggle (legend hidden via studio.css).
    {name: 'titleAndHidden', options: {columns: 2}},
    // Untitled layout row (legend hidden via studio.css — Sanity auto-titles from name).
    {name: 'slugAndDate', options: {columns: 2}},
    {name: 'copy', title: 'Description', options: {columns: 2}},
    {name: 'taxonomy', title: 'Formats / Industries / Markets', options: {columns: 3}},
    // Untitled layout row (legend hidden via studio.css) — featured image alone.
    // Video URLs live in `videos[]` (first = main). Legacy root video fields stay
    // hidden for dual-read until Option B / cutover.
    {name: 'featuredAndVideo', options: {columns: 1}},
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      fieldset: 'titleAndHidden',
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
      // Omit fieldset so NullField does not consume a column in titleAndHidden.
      components: {field: NullField},
    }),

    defineField({
      name: 'isHidden',
      title: 'Hidden from Public Portfolio',
      type: 'boolean',
      group: 'content',
      fieldset: 'titleAndHidden',
      initialValue: false,
      hidden: hiddenForTranslator,
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
      title: 'Formats',
      type: 'array',
      group: 'content',
      fieldset: 'taxonomy',
      of: [
        {
          type: 'reference',
          to: [{type: 'videoFormat'}],
          options: {
            filter: `!(_id in [$keyVisualFormatId, $keyVisualFormatDraftId])`,
            filterParams: {
              keyVisualFormatId: KEY_VISUAL_VIDEO_FORMAT_ID,
              keyVisualFormatDraftId: `drafts.${KEY_VISUAL_VIDEO_FORMAT_ID}`,
            },
          },
        },
      ],
      components: {input: TaxonomyCheckboxInput},
      hidden: hiddenForTranslator,
      validation: (rule) =>
        rule.custom(async (formats, context) => {
          // Key Visual format is system-managed by key-visual-tag (not sticky).
          // TaxonomyCheckboxInput hides it; this blocks Vision / stale-form
          // manual add or remove. API Function patches skip Studio validation.
          const nextRefs = new Set(
            (formats ?? [])
              .map((item) =>
                typeof item === 'object' && item && '_ref' in item
                  ? String((item as {_ref?: string})._ref ?? '').replace(/^drafts\./, '')
                  : '',
              )
              .filter(Boolean),
          )
          const hasNext = nextRefs.has(KEY_VISUAL_VIDEO_FORMAT_ID)

          const docId = context.document?._id
          if (!docId) return true

          const client = context.getClient({apiVersion: '2025-01-01'})
          const prevRefs = await client.fetch<string[]>(
            `coalesce(*[_id == $id][0].videoFormats[]._ref, [])`,
            {id: docId},
          )
          const hadPrev = prevRefs.some((ref) => isKeyVisualVideoFormatId(ref))

          const keyVisuals = (
            context.document as {keyVisuals?: unknown[] | null} | undefined
          )?.keyVisuals
          const hasKeyVisuals = Array.isArray(keyVisuals) && keyVisuals.length > 0

          if (hasNext && !hadPrev) {
            return '“Key Visual” is assigned automatically when Key Visuals are added — it cannot be selected manually.'
          }
          if (!hasNext && hadPrev && hasKeyVisuals) {
            return '“Key Visual” is removed automatically when all Key Visuals are cleared — it cannot be unchecked manually.'
          }
          return true
        }),
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
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'media',
      fieldset: 'featuredAndVideo',
      // hotspot UI is custom (FeaturedImageHotspotInput); keep stock upload via renderDefault.
      // Data still writes standard hotspot/crop for urlForImage().
      // Campaign-level poster (cards, OG, homepage stills) — Option A keeps this
      // on the document; Option B may later mirror from videos[0].
      options: {hotspot: false},
      components: {input: FeaturedImageHotspotInput},
      validation: (rule) => rule.required(),
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'videos',
      title: 'Videos',
      type: 'array',
      group: 'media',
      of: [{type: 'portfolioVideo'}],
      description:
        'First item is the main film (case page primary player + homepage carousel candidate). Drag to reorder. Items below are additional films.',
      hidden: hiddenForTranslatorWhenEmpty,
      components: {input: TranslatorLockedArrayInput},
      validation: (rule) =>
        rule.custom((videos, context) => {
          const rows = Array.isArray(videos) ? videos : []
          if (rows.length === 0) {
            const legacyUrl = (
              context.document as {vimeoUrl?: string} | undefined
            )?.vimeoUrl
            if (legacyUrl?.trim()) return true
            return 'Add at least one video — the first item is the main film.'
          }
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i] as
              | {
                  vimeoUrl?: string
                  videoTitle?: string
                }
              | undefined
            if (!row?.vimeoUrl?.trim()) {
              return `Video ${i + 1}: Video URL is required.`
            }
            if (i > 0 && !row.videoTitle?.trim()) {
              return `Video ${i + 1}: Video Title is required on additional films.`
            }
          }
          return true
        }),
    }),

    // --- Legacy main-film fields (hidden; dual-read until cutover) ---
    ...defineLocalePair({
      name: 'vimeoUrl',
      zhName: 'xinpianchangUrl',
      title: 'Video URL (legacy)',
      type: 'url',
      group: 'media',
      vimeoPicker: true,
      description: 'Legacy main film URL — prefer Videos[0]. Kept for dual-read.',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
      zhValidation: (rule) => rule.uri({scheme: ['http', 'https']}),
      optional: true,
      editorCanEditZh: true,
      hidden: () => true,
    }),

    defineField({
      name: 'previewCleanVimeoUrl',
      title: 'Clean Preview Video URL (legacy)',
      type: 'url',
      group: 'media',
      hidden: () => true,
      components: {field: OptionalField, input: VimeoUrlInput},
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'previewStartSeconds',
      title: 'In and Out Points (legacy)',
      type: 'number',
      group: 'media',
      hidden: () => true,
      components: {field: PreviewBoundsPairField},
      validation: (rule) => rule.min(0),
    }),

    defineField({
      name: 'previewEndSeconds',
      title: 'End (legacy)',
      type: 'number',
      group: 'media',
      hidden: () => true,
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
      title: 'Hero Film Title (legacy)',
      type: 'string',
      group: 'media',
      description: 'Legacy — prefer Videos[0] Video Title. Kept for dual-read.',
      hidden: () => true,
    }),

    defineField({
      name: 'additionalVideos',
      title: 'Additional Videos (legacy)',
      type: 'array',
      group: 'media',
      of: [{type: 'additionalVideo'}],
      description: 'Legacy — prefer Videos. Kept for dual-read.',
      hidden: () => true,
      components: {input: TranslatorLockedArrayInput},
    }),

    defineField({
      name: 'keyVisuals',
      title: 'Key Visuals',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: false},
          preview: {
            select: {
              media: 'asset',
              filename: 'asset.originalFilename',
              assetTitle: 'asset.title',
              slotKey: '_key',
            },
            prepare: ({
              media,
              filename,
              assetTitle,
              slotKey,
            }: {
              media?: PreviewValue['media']
              filename?: string
              assetTitle?: string
              slotKey?: string
            }) => ({
              title:
                (typeof filename === 'string' && filename.trim()) ||
                (typeof assetTitle === 'string' && assetTitle.trim()) ||
                'Image',
              media,
              slotKey,
            }),
          },
          components: {
            input: KeyVisualImageInput,
            preview: KeyVisualPreview,
          },
        },
      ],
      group: 'media',
      hidden: hiddenForTranslator,
      components: {input: KeyVisualsArrayInput},
      description:
        'Still-photography gallery below crew credits. Layout is a two-column rhythm (Left / Middle+Right pair / Hero Two-Columns) from list order — reorder so standout frames get Hero Two-Columns. Uses Media Library metadata (alt, title, credit); no per-item captions. Bulk uploads auto-tag via key-visual-tag. Drag multiple photos onto this field (below existing thumbnails) — do not batch-drop inside a single photo popup.',
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
