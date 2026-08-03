/**
 * page — Flexible static page document.
 *
 * Source: content-schema.md §4.4
 *
 * Two tabs:
 * - Page Details — Title → Card (image | excerpt) → slug, hero chrome, SEO
 * - Content — frontend-aligned widgets (carousel → featured work → body → logos…)
 */

import {defineField, defineType} from 'sanity'

import {ClearableArrayInput} from '../components/ClearableArrayInput'
import {TranslatorLockedArrayInput} from '../components/TranslatorLockedArrayInput'
import {BilingualPortableTextInput} from '../components/body/BilingualPortableTextInput'
import {defineLocalePair, hideZhPortableText, hiddenForTranslatorWhenEmpty} from '../lib/define-locale-pair'
import {hideUnlessPageSlug} from '../lib/page-visibility'
import {getStudioRole, hiddenForTranslator} from '../lib/studio-roles'

export const page = defineType({
  name: 'page',
  title: 'Pages',
  type: 'document',

  groups: [
    {name: 'details', title: 'Page Details', default: true},
    {name: 'content', title: 'Content'},
  ],

  fieldsets: [
    {name: 'card', title: 'Card', options: {columns: 2}},
  ],

  fields: [
    // —— Page Details (matches blogPost: Title → Card → slug) ——
    ...defineLocalePair({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'details',
      validation: (rule) => rule.required(),
      optional: false,
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
      description: 'Card / teaser copy. Usually the former body lead paragraph.',
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
      name: 'showHeroHeader',
      title: 'Show Hero Header',
      type: 'boolean',
      group: 'details',
      description: 'Off for Home and Campaign Brief pages.',
      initialValue: true,
      hidden: hiddenForTranslator,
    }),

    ...defineLocalePair({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'text',
      rows: 2,
      group: 'details',
      description: 'Supports <span class="vp-outline">.',
      optional: true,
      hidden: ({document}) => document?.showHeroHeader === false,
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

    // —— Content (frontend order on Home) ——
    defineField({
      name: 'heroSlides',
      title: 'Hero Carousel Slides',
      type: 'array',
      group: 'content',
      of: [{type: 'reference', to: [{type: 'portfolioEntry'}]}],
      description:
        'Full-viewport carousel at the top of the home page (display order). Button label is always “Watch”.',
      hidden: (ctx) => hideUnlessPageSlug('home')(ctx) || hiddenForTranslator(ctx),
      components: {input: ClearableArrayInput},
      options: {
        clearAll: {
          confirmTitle: 'Clear hero carousel?',
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
        'Curated portfolio grid (display order). Home: “A Bit of Our Work” (falls back to nine most recent). Vietnam Production Service: “Shot in Vietnam” (falls back to all Vietnam-tagged projects).',
      hidden: (ctx) =>
        hideUnlessPageSlug(['home', 'vietnam-production-service'])(ctx) ||
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

    defineField({
      name: 'body',
      title: 'Body (English)',
      type: 'pagePortableText',
      group: 'content',
      description: 'Main page copy. On Home: company description under Featured Work.',
      validation: (rule) => rule.required(),
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'translator',
      hidden: hiddenForTranslatorWhenEmpty,
      components: {input: BilingualPortableTextInput},
    }),

    defineField({
      name: 'bodyZh',
      title: 'Body (Chinese)',
      type: 'pagePortableText',
      group: 'content',
      hidden: hideZhPortableText('body'),
      readOnly: ({currentUser}) => getStudioRole(currentUser) === 'editor',
      components: {input: BilingualPortableTextInput},
    }),

    defineField({
      name: 'brandLogos',
      title: 'Brand Logos',
      type: 'array',
      group: 'content',
      of: [{type: 'brandLogoItem'}],
      description:
        '“Brands We Work With” grid on the home page. Drag to reorder or swap among curated registry logos. Falls back to the default logo set if empty. Adding a new brand mark is a design/code change (SVG + shared/client-logos entry + redeploy), not a Studio upload.',
      hidden: (ctx) => hideUnlessPageSlug('home')(ctx) || hiddenForTranslator(ctx),
      components: {input: ClearableArrayInput},
      options: {
        clearAll: {
          confirmTitle: 'Clear brand logos?',
          confirmBody:
            'Remove every brand logo from this draft? The homepage grid will fall back to the default logo set until you curate again. Publish to make this live.',
        },
      } as never,
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
