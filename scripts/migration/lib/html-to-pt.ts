import { JSDOM } from 'jsdom';
import { htmlToBlocks } from '@portabletext/block-tools';
import { Schema } from '@sanity/schema';

const defaultSchema = Schema.compile({
  name: 'default',
  types: [
    {
      type: 'object',
      name: 'blogPost',
      fields: [{ name: 'body', type: 'array', of: [{ type: 'block' }] }],
    },
    {
      type: 'block',
      name: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            fields: [{ name: 'href', type: 'url' }],
          },
        ],
      },
    },
  ],
});

const blockContentType = defaultSchema
  .get('blogPost')
  .fields.find((f: { name: string }) => f.name === 'body').type;

export function htmlToPortableText(html: string): unknown[] {
  if (!html?.trim()) {
    return [emptyBlock()];
  }

  try {
    const blocks = htmlToBlocks(html, blockContentType, {
      parseHtml: (h) => new JSDOM(h).window.document,
    });
    return blocks.length ? blocks : [textBlock(stripTags(html))];
  } catch {
    return [textBlock(stripTags(html))];
  }
}

function emptyBlock(): unknown {
  return {
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', text: '', marks: [] }],
  };
}

function textBlock(text: string): unknown {
  return {
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', text: text.slice(0, 10000), marks: [] }],
  };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
