/**
 * imageGallery — Masonry image grid from WordPress wp:gallery blocks.
 */

import { defineField, defineType } from 'sanity';

export const imageGallery = defineType({
  name: 'imageGallery',
  title: 'Image Gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      initialValue: 3,
      validation: (rule) => rule.min(1).max(6),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'galleryImage',
          fields: [
            defineField({ name: 'image', title: 'Image', type: 'image' }),
            defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
          preview: {
            select: { title: 'caption', media: 'image' },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { columns: 'columns', images: 'images' },
    prepare({ columns, images }) {
      const count = Array.isArray(images) ? images.length : 0;
      return {
        title: `Gallery (${count} images)`,
        subtitle: `${columns ?? 3} columns`,
      };
    },
  },
});
