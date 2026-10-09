/**
 * page — Flexible static page document.
 *
 * Source: content-schema.md §4.4
 *
 * Tabs:
 * - Page Details — Title → Card (image | excerpt) → slug, hero chrome, SEO
 * - Content — frontend-aligned widgets (carousel → featured work → body → logos…)
 *   Hidden on the news (Production Log) page — intro lives in Excerpt.
 */

import {defineField, defineType} from 'sanity'

import {ClearableArrayInput} from '../components/ClearableArrayInput'
import {TranslatorLockedArrayInput} from '../components/TranslatorLockedArrayInput'
import {BilingualPortableTextInput} from '../components/body/BilingualPortableTextInput'
import {defineLocalePair, hideZhPortableText, hiddenForTranslatorWhenEmpty} from '../lib/define-locale-pair'
import {hideUnlessPageSlug, isPageSlug} from '../lib/page-visibility'
import {getStudioRole, hiddenForTranslator} from '../lib/studio-roles'

export const page = defineType({
  name: 'page',
  title: 'Pages',
  type: 'document',

  groups: [
    {name: 'details', title: 'Page Details', default: true},
    // News only uses Page Details (title + excerpt intro) — hide Content there.
    {
      name: 'content',
      title: 'Content',
      hidden: ({document, value}) =>
        isPageSlug((document ?? value) as Record<string, unknown> | undefined, 'news'),
    },
  ],

  fieldsets: [
    // Untitled layout row (legend hidden via studio.css — Sanity auto-titles from name).
    {name: 'titleAndNav', options: {columns: 2}},
    {name: 'card', title: 'Card', options: {columns: 2}},
  ],

  fields: [
    // —— Page Details (matches blogPost: Title → Card → slug) ——
    ...defineLocalePair({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'details',
      fieldset: 'titleAndNav',
      validation: (rule) => rule.required(),
      optional: false,
    }),

    ...defineLocalePair({
      name: 'navLabel',
      title: 'Nav Label',
      type: 'string',
      group: 'details',
      fieldset: 'titleAndNav',
      optional: true,
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'details',
      fieldset: 'card',
      options: {hotspot: true},
      hidden: hiddenForTranslator,
    }),

    ...defineLocalePair({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'details',
      fieldset: 'card',
      description:
        'Card / teaser copy. On Production Log (news): the page intro under the title.',
      optional: true,
    }),

    ...defineLocalePair({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'details',
      description:
        'Read-only — reflects the actual hardcoded route. Routing for this page is fixed in code and cannot be changed here.',
      options: {source: 'title', maxLength: 96},
      zhOptions: {source: 'titleZh', maxLength: 96},
      validation: (rule) => rule.required(),
      optional: false,
      readOnly: true,
    }),

    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      group: 'details',
      description: 'Exclude from search indexing and sitemap (typically work-internal).',
      initialValue: false,
      hidden: hiddenForTranslator,
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoFields',
      group: 'details',
    }),

    // —— Content (frontend order) ——
    defineField({
      name: 'carouselSlides',
      title: 'Carousel Slides',
      type: 'array',
      group: 'content',
      of: [{type: 'reference', to: [{type: 'portfolioEntry'}]}],
      description:
        'Drag to reorder. Powers the homepage carousel and Work featured strip.',
      hidden: (ctx) =>
        hideUnlessPageSlug('home')(ctx) || hiddenForTranslator(ctx),
      components: {input: ClearableArrayInput},
      options: {
        clearAll: {
          confirmTitle: 'Clear carousel slides?',
          confirmBody:
            'Remove every carousel slide from this draft? The homepage hero will be empty until you add slides again. Publish to make this live.',
        },
      } as never,
    }),

    defineField({
      name: 'featuredWork',
      title: 'Featured Work',
      type: 'array',
      group: 'content',
      of: [{type: 'reference', to: [{type: 'portfolioEntry'}]}],
      description:
        'Curated portfolio grid (display order). Vietnam Production Service: “Shot in Vietnam” (falls back to all Vietnam-tagged projects).',
      hidden: (ctx) =>
        hideUnlessPageSlug(['vietnam-production-service'])(ctx) ||
        hiddenForTranslator(ctx),
      components: {input: ClearableArrayInput},
      options: {
        clearAll: {
          confirmTitle: 'Clear featured work?',
          confirmBody:
            'Remove every featured project from this draft? The grid will fall back to its default list until you curate again. Publish to make this live.',
        },
      } as never,
    }),

    // —— About media (slug `about`) ——
    defineField({
      name: 'specialties',
      title: 'Our Specialties',
      type: 'array',
      group: 'content',
      of: [{type: 'aboutMediaSlot'}],
      description:
        '(1) Product launch films, (2) Story-driven spots, (3) Branded documentaries, (4) High-volume social campaigns. Each slot: portfolio preview, custom Vimeo/YouTube, or a still.',
      validation: (rule) =>
        rule.custom((value) => {
          if (value == null || (Array.isArray(value) && value.length === 0)) return true
          if (!Array.isArray(value) || value.length !== 4) {
            return 'Use exactly 4 specialty slots, or leave empty for automatic portfolio placeholders'
          }
          return true
        }),
      hidden: (ctx) =>
        hideUnlessPageSlug('about')(ctx) || hiddenForTranslator(ctx),
    }),

    defineField({
      name: 'advantages',
      title: 'Our Advantages',
      type: 'array',
      group: 'content',
      of: [{type: 'aboutMediaSlot'}],
      description:
        '(1) Creative + execution as one, (2) Set for the global stage, (3) Built for speed and scale, (4) Complex tech, simplified. Each slot: portfolio preview, custom Vimeo/YouTube, or a still.',
      validation: (rule) =>
        rule.custom((value) => {
          if (value == null || (Array.isArray(value) && value.length === 0)) return true
          if (!Array.isArray(value) || value.length !== 4) {
            return 'Use exactly 4 advantage slots, or leave empty for automatic portfolio placeholders'
          }
          return true
        }),
      hidden: (ctx) =>
        hideUnlessPageSlug('about')(ctx) || hiddenForTranslator(ctx),
    }),

    defineField({
      name: 'productionServicesCta',
      title: 'Production Services CTA',
      type: 'aboutMediaSlot',
      group: 'content',
      description:
        'Media for the yellow “Get the full rundown” row. Portfolio preview, custom Vimeo/YouTube, or static image. Leave empty for the automatic placeholder.',
      hidden: (ctx) =>
        hideUnlessPageSlug('about')(ctx) || hiddenForTranslator(ctx),
    }),

    defineField({
      name: 'productionLogCta',
      title: 'Production Log CTA',
      type: 'aboutMediaSlot',
      group: 'content',
      description:
        'Media for the white “Explore the production log” row. Portfolio preview, custom Vimeo/YouTube, or static image. Leave empty for the automatic placeholder.',
      hidden: (ctx) =>
        hideUnlessPageSlug('about')(ctx) || hiddenForTranslator(ctx),
    }),

    defineField({
      name: 'statementMarkers',
      title: 'Statement Inline Markers',
      type: 'array',
      group: 'content',
      of: [{type: 'aboutMediaImageSlot'}],
      description:
        'Two stills that expand inline in the statement copy. Images only (no video). Leave empty for automatic placeholders.',
      validation: (rule) =>
        rule.custom((value) => {
          if (value == null || (Array.isArray(value) && value.length === 0)) return true
          if (!Array.isArray(value) || value.length !== 2) {
            return 'Use exactly 2 marker images, or leave empty for automatic portfolio placeholders'
          }
          return true
        }),
      hidden: (ctx) =>
        hideUnlessPageSlug('about')(ctx) || hiddenForTranslator(ctx),
    }),

    defineField({
      name: 'statementFilmStrip',
      title: 'Statement Film Strip',
      type: 'array',
      group: 'content',
      of: [{type: 'aboutMediaImageSlot'}],
      description:
        'Ten stills: first five → left/top strip, next five → right/bottom strip. Images only (no video). Leave empty for automatic placeholders.',
      validation: (rule) =>
        rule.custom((value) => {
          if (value == null || (Array.isArray(value) && value.length === 0)) return true
          if (!Array.isArray(value) || value.length !== 10) {
            return 'Use exactly 10 film-strip images, or leave empty for automatic portfolio placeholders'
          }
          return true
        }),
      hidden: (ctx) =>
        hideUnlessPageSlug('about')(ctx) || hiddenForTranslator(ctx),
    }),

    defineField({
      name: 'body',
      title: 'Body (English)',
      type: 'pagePortableText',
      group: 'content',
      description: 'Main page copy.',
      // News uses Excerpt; Home is media-first (carousel).
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as Record<string, unknown>
          if (isPageSlug(doc, ['news', 'home'])) {
            return true
          }
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return 'Required'
          }
          return true
        }),
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'translator',
      hidden: (ctx) => Boolean(hiddenForTranslatorWhenEmpty(ctx)),
      components: {input: BilingualPortableTextInput},
    }),

    defineField({
      name: 'bodyZh',
      title: 'Body (Chinese)',
      type: 'pagePortableText',
      group: 'content',
      hidden: (ctx) => Boolean(hideZhPortableText('body')(ctx)),
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'editor',
      components: {input: BilingualPortableTextInput},
    }),

    defineField({
      name: 'founders',
      title: 'Founders',
      type: 'array',
      group: 'content',
      of: [{type: 'founder'}],
      description: 'Team cards on the About page (name, title, photo).',
      hidden: (ctx) =>
        hideUnlessPageSlug('about')(ctx) || hiddenForTranslatorWhenEmpty(ctx),
      components: {input: TranslatorLockedArrayInput},
    }),

    defineField({
      name: 'pdfDownload',
      title: 'PDF Download',
      type: 'pdfDownload',
      group: 'content',
      description: 'Downloadable PDF shown on the Vietnam Location Guide page.',
      hidden: hideUnlessPageSlug('vietnam-location-guide'),
    }),

    defineField({
      name: 'awardItems',
      title: 'Award Items',
      type: 'array',
      group: 'content',
      of: [{type: 'awardItem'}],
      description:
        'Awards page only. Entries are placeholder/invented until real award data is supplied.',
      hidden: hideUnlessPageSlug('awards'),
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
      subtitle: 'slug.current',
      media: 'featuredImage',
      noIndex: 'noIndex',
    },
    prepare({title, subtitle, media, noIndex}) {
      return {
        title: noIndex ? `[Noindex] ${title}` : title,
        subtitle: subtitle ? `/${subtitle}/` : undefined,
        media,
      }
    },
  },
})
