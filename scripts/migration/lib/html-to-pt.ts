import { JSDOM } from 'jsdom';
import { htmlToBlocks } from '@portabletext/block-tools';
import { Schema } from '@sanity/schema';
import type { IdMap } from './id-map';
import { imageField } from './id-map';

/** Schema for htmlToBlocks — text blocks only (images are inserted separately). */
const textBlockSchema = Schema.compile({
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
        { title: 'H1', value: 'h1' },
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

const blockContentType = textBlockSchema
  .get('blogPost')
  .fields.find((f: { name: string }) => f.name === 'body').type;

const WP_IMAGE_BLOCK_REGEX =
  /<!--\s*wp:image\b[^>]*\{"id":(\d+)[^>]*-->[\s\S]*?<!--\s*\/wp:image\s*-->/gi;

const WP_EMBED_BLOCK_REGEX =
  /<!--\s*wp:embed\b[^>]*\{"url":"([^"]+)"[^>]*-->[\s\S]*?<!--\s*\/wp:embed\s*-->/gi;

type HtmlSegment =
  | { type: 'html'; content: string }
  | { type: 'image'; wpId: number; alt: string }
  | { type: 'video'; url: string };

interface WpMediaMatch {
  index: number;
  length: number;
  kind: 'image' | 'video';
  wpId?: number;
  alt?: string;
  url?: string;
}

function blockKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

function decodeHtmlEntities(value: string): string {
  return new JSDOM(`<!DOCTYPE html><body>${value}</body>`).window.document.body
    .textContent!;
}

function isEmbeddableVideoUrl(url: string): boolean {
  return /vimeo\.com|youtube\.com|youtu\.be/i.test(url);
}

function findWpMediaMatches(html: string): WpMediaMatch[] {
  const matches: WpMediaMatch[] = [];

  for (const match of html.matchAll(WP_IMAGE_BLOCK_REGEX)) {
    const index = match.index ?? 0;
    const altMatch = match[0].match(/\salt="([^"]*)"/i);
    matches.push({
      index,
      length: match[0].length,
      kind: 'image',
      wpId: Number(match[1]),
      alt: altMatch ? decodeHtmlEntities(altMatch[1]) : '',
    });
  }

  for (const match of html.matchAll(WP_EMBED_BLOCK_REGEX)) {
    const url = match[1];
    if (!isEmbeddableVideoUrl(url)) continue;
    matches.push({
      index: match.index ?? 0,
      length: match[0].length,
      kind: 'video',
      url,
    });
  }

  return matches.sort((a, b) => a.index - b.index);
}

function splitHtmlWithWpMedia(html: string): HtmlSegment[] {
  const matches = findWpMediaMatches(html);
  if (!matches.length) {
    return [{ type: 'html', content: html }];
  }

  const segments: HtmlSegment[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    if (match.index > lastIndex) {
      segments.push({ type: 'html', content: html.slice(lastIndex, match.index) });
    }

    if (match.kind === 'image' && match.wpId) {
      segments.push({ type: 'image', wpId: match.wpId, alt: match.alt ?? '' });
    } else if (match.kind === 'video' && match.url) {
      segments.push({ type: 'video', url: match.url });
    }

    lastIndex = match.index + match.length;
  }

  if (lastIndex < html.length) {
    segments.push({ type: 'html', content: html.slice(lastIndex) });
  }

  return segments;
}

function videoUrlBlock(url: string): unknown {
  return {
    _key: blockKey(),
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', text: url, marks: [] }],
  };
}

function htmlToPortableTextBlocksOnly(html: string): unknown[] {
  if (!html?.trim()) {
    return [];
  }

  try {
    const blocks = htmlToBlocks(html, blockContentType, {
      parseHtml: (h) => new JSDOM(h).window.document,
    });
    return blocks.length ? blocks : [textBlock(stripTags(html))];
  } catch (err) {
    console.warn('htmlToBlocks failed, falling back to stripped text:', err);
    return [textBlock(stripTags(html))];
  }
}

export function htmlToPortableText(html: string, idMap?: IdMap): unknown[] {
  if (!html?.trim()) {
    return [emptyBlock()];
  }

  if (!idMap) {
    return htmlToPortableTextBlocksOnly(html);
  }

  const segments = splitHtmlWithWpMedia(html);
  const blocks: unknown[] = [];

  for (const segment of segments) {
    if (segment.type === 'image') {
      const image = imageField(idMap, segment.wpId);
      if (!image) {
        console.warn(`Missing Sanity asset for WordPress image ${segment.wpId}`);
        continue;
      }

      const imageBlock: Record<string, unknown> = {
        _key: blockKey(),
        ...image,
      };
      if (segment.alt) imageBlock.alt = segment.alt;
      blocks.push(imageBlock);
      continue;
    }

    if (segment.type === 'video') {
      blocks.push(videoUrlBlock(segment.url));
      continue;
    }

    blocks.push(...htmlToPortableTextBlocksOnly(segment.content));
  }

  return blocks.length ? blocks : [emptyBlock()];
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
