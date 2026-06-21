/**
 * page — Flexible static page document.
 *
 * Source: content-schema.md §4.4
 * WordPress origin: `page` (9 entries — 8 public bilingual + 1 internal EN-only)
 *
 * Supports optional hero header, homepage carousel slides, and About page founders.
 */

import { defineField, defineType } from 'sanity';

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title (English)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'titleZh',
      title: 'Title (Chinese)',
      type: 'string',
    }),

    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      description: 'URL slug — must match live site URLs (e.g. about, work, news).',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slugZh',
      title: 'Slug (Chinese)',
      type: 'slug',
      description: 'Chinese URL slug for /zh/[slug]/ pages.',
      options: { source: 'titleZh', maxLength: 96 },
    }),

    defineField({
      name: 'showHeroHeader',
      title: 'Show Hero Header',
      type: 'boolean',
      description:
        'Display PageHero header. Off for Home and Campaign Brief pages (§4.4).',
      initialValue: true,
    }),

    defineField({
      name: 'heroTitle',
      title: 'Hero Title (English)',
      type: 'text',
      rows: 2,
      description: 'Page hero heading — supports <span class="vp-outline"> for outline text.',
    }),

    defineField({
      name: 'heroTitleZh',
      title: 'Hero Title (Chinese)',
      type: 'text',
      rows: 2,
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Hero background image when showHeroHeader is enabled.',
    }),

    defineField({
      name: 'body',
      title: 'Body (English)',
      type: 'array',
      of: [{ type: 'block' }],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'bodyZh',
      title: 'Body (Chinese)',
      type: 'array',
      of: [{ type: 'block' }],
    }),

    defineField({
      name: 'heroSlides',
      title: 'Hero Carousel Slides',
      type: 'array',
      of: [{ type: 'heroSlide' }],
      description: 'Homepage only — full-viewport carousel referencing portfolio entries.',
    }),

    defineField({
      name: 'founders',
      title: 'Founders',
      type: 'array',
      of: [{ type: 'founder' }],
      description: 'About page only — founder profiles, also feeds JSON-LD structured data.',
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seoFields',
    }),

    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      description:
        'Exclude from search engine indexing and sitemap. ' +
        'Required for work-internal page only (§4.4).',
      initialValue: false,
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
      media: 'featuredImage',
      noIndex: 'noIndex',
    },
    prepare({ title, subtitle, media, noIndex }) {
      return {
        title: noIndex ? `[Noindex] ${title}` : title,
        subtitle: subtitle ? `/${subtitle}/` : undefined,
        media,
      };
    },
  },
});
