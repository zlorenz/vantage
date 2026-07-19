/**
 * page — Flexible static page document.
 *
 * Source: content-schema.md §4.4
 * WordPress origin: `page` (9 entries — 8 public bilingual + 1 internal EN-only)
 */

import { defineField, defineType } from 'sanity';

export const page = defineType({
  name: 'page',
  title: 'Pages',
  type: 'document',

  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'body', title: 'Body' },
    { name: 'extras', title: 'Extras' },
    { name: 'seo', title: 'SEO' },
  ],

  fieldsets: [
    { name: 'titles', title: 'Titles', options: { columns: 2 } },
    { name: 'slugs', title: 'Slugs', options: { columns: 2 } },
    { name: 'hero', title: 'Hero', options: { columns: 2 } },
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
      description: 'Must match live URLs (e.g. about, work, news).',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'slugZh',
      title: 'Slug (Chinese)',
      type: 'slug',
      group: 'content',
      fieldset: 'slugs',
      options: { source: 'titleZh', maxLength: 96 },
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'content',
      description: 'Original WordPress publish date.',
    }),

    defineField({
      name: 'showHeroHeader',
      title: 'Show Hero Header',
      type: 'boolean',
      group: 'content',
      description: 'Off for Home and Campaign Brief pages.',
      initialValue: true,
    }),

    defineField({
      name: 'heroTitle',
      title: 'Hero Title (English)',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'hero',
      description: 'Supports <span class="vp-outline">.',
    }),

    defineField({
      name: 'heroTitleZh',
      title: 'Hero Title (Chinese)',
      type: 'text',
      rows: 2,
      group: 'content',
      fieldset: 'hero',
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      description: 'Hero background when Show Hero Header is on.',
    }),

    defineField({
      name: 'body',
      title: 'Body (English)',
      type: 'array',
      group: 'body',
      of: [{ type: 'block' }, { type: 'image' }, { type: 'imageGallery' }, { type: 'ctaButton' }],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'bodyZh',
      title: 'Body (Chinese)',
      type: 'array',
      group: 'body',
      of: [{ type: 'block' }, { type: 'image' }, { type: 'imageGallery' }, { type: 'ctaButton' }],
    }),

    defineField({
      name: 'heroSlides',
      title: 'Hero Carousel Slides',
      type: 'array',
      group: 'extras',
      of: [{ type: 'heroSlide' }],
      description: 'Homepage only.',
    }),

    defineField({
      name: 'founders',
      title: 'Founders',
      type: 'array',
      group: 'extras',
      of: [{ type: 'founder' }],
      description: 'About page only.',
    }),

    defineField({
      name: 'pdfDownload',
      title: 'PDF Download',
      type: 'pdfDownload',
      group: 'extras',
      description: 'Optional (Vietnam Location Guide).',
    }),

    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      group: 'seo',
      description: 'Exclude from search indexing and sitemap (work-internal).',
      initialValue: false,
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
