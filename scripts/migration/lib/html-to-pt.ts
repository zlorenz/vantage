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

const WP_FILE_BLOCK_REGEX =
  /<!--\s*wp:file\b[^>]*-->[\s\S]*?<!--\s*\/wp:file\s*-->/gi;

const WP_GALLERY_BLOCK_REGEX =
  /<!--\s*wp:gallery\b([^>]*)-->[\s\S]*?<!--\s*\/wp:gallery\s*-->/gi;

const WP_BUTTON_BLOCK_REGEX =
  /<!--\s*wp:wp-bootstrap-blocks\/button\b([^>]*)\/-->/gi;

const WP_IMAGE_BLOCK_REGEX =
  /<!--\s*wp:image\b[^>]*\{"id":(\d+)[^>]*-->[\s\S]*?<!--\s*\/wp:image\s*-->/gi;

const WP_EMBED_BLOCK_REGEX =
  /<!--\s*wp:embed\b[^>]*\{"url":"([^"]+)"[^>]*-->[\s\S]*?<!--\s*\/wp:embed\s*-->/gi;

type HtmlSegment =
  | { type: 'html'; content: string }
  | { type: 'gallery'; content: string; attrs: string }
  | { type: 'button'; attrs: string }
  | { type: 'image'; wpId: number; alt: string; caption: string }
  | { type: 'video'; url: string };

interface WpBlockMatch {
  index: number;
  length: number;
  kind: 'gallery' | 'button' | 'image' | 'video';
  attrs?: string;
  content?: string;
  wpId?: number;
  alt?: string;
  caption?: string;
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

function stripWpFileBlocks(html: string): string {
  return html.replace(WP_FILE_BLOCK_REGEX, '');
}

function parseImageBlockContent(content: string, wpId: number): Pick<WpBlockMatch, 'alt' | 'caption'> {
  const altMatch = content.match(/\salt="([^"]*)"/i);
  const captionMatch = content.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
  return {
    alt: altMatch ? decodeHtmlEntities(altMatch[1]) : '',
    caption: captionMatch ? decodeHtmlEntities(captionMatch[1]) : '',
  };
}

function isInsideRange(index: number, ranges: Array<{ start: number; end: number }>): boolean {
  return ranges.some((range) => index >= range.start && index < range.end);
}

function findWpBlockMatches(html: string): WpBlockMatch[] {
  const galleryRanges: Array<{ start: number; end: number }> = [];
  const matches: WpBlockMatch[] = [];

  for (const match of html.matchAll(WP_GALLERY_BLOCK_REGEX)) {
    const index = match.index ?? 0;
    const length = match[0].length;
    galleryRanges.push({ start: index, end: index + length });
    matches.push({
      index,
      length,
      kind: 'gallery',
      attrs: match[1] ?? '',
      content: match[0],
    });
  }

  for (const match of html.matchAll(WP_BUTTON_BLOCK_REGEX)) {
    const index = match.index ?? 0;
    if (isInsideRange(index, galleryRanges)) continue;
    matches.push({
      index,
      length: match[0].length,
      kind: 'button',
      attrs: match[1] ?? '',
    });
  }

  for (const match of html.matchAll(WP_IMAGE_BLOCK_REGEX)) {
    const index = match.index ?? 0;
    if (isInsideRange(index, galleryRanges)) continue;
    const wpId = Number(match[1]);
    const { alt, caption } = parseImageBlockContent(match[0], wpId);
    matches.push({
      index,
      length: match[0].length,
      kind: 'image',
      wpId,
      alt,
      caption,
    });
  }

  for (const match of html.matchAll(WP_EMBED_BLOCK_REGEX)) {
    const index = match.index ?? 0;
    if (isInsideRange(index, galleryRanges)) continue;
    const url = match[1];
    if (!isEmbeddableVideoUrl(url)) continue;
    matches.push({
      index,
      length: match[0].length,
      kind: 'video',
      url,
    });
  }

  return matches.sort((a, b) => a.index - b.index);
}

function splitHtmlWithWpBlocks(html: string): HtmlSegment[] {
  const matches = findWpBlockMatches(html);
  if (!matches.length) {
    return [{ type: 'html', content: html }];
  }

  const segments: HtmlSegment[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    if (match.index > lastIndex) {
      segments.push({ type: 'html', content: html.slice(lastIndex, match.index) });
    }

    if (match.kind === 'gallery' && match.content) {
      segments.push({
        type: 'gallery',
        content: match.content,
        attrs: match.attrs ?? '',
      });
    } else if (match.kind === 'button') {
      segments.push({ type: 'button', attrs: match.attrs ?? '' });
    } else if (match.kind === 'image' && match.wpId) {
      segments.push({
        type: 'image',
        wpId: match.wpId,
        alt: match.alt ?? '',
        caption: match.caption ?? '',
      });
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

function galleryBlock(content: string, attrs: string, idMap: IdMap): unknown | null {
  const columnsMatch = attrs.match(/"columns"\s*:\s*(\d+)/);
  const columns = columnsMatch ? Number(columnsMatch[1]) : 3;
  const images: unknown[] = [];

  for (const match of content.matchAll(WP_IMAGE_BLOCK_REGEX)) {
    const wpId = Number(match[1]);
    const { alt, caption } = parseImageBlockContent(match[0], wpId);
    const image = imageField(idMap, wpId);
    if (!image) {
      console.warn(`Missing Sanity asset for WordPress image ${wpId}`);
      continue;
    }

    images.push({
      _key: blockKey(),
      image,
      ...(alt ? { alt } : {}),
      ...(caption ? { caption } : {}),
    });
  }

  if (!images.length) return null;

  return {
    _key: blockKey(),
    _type: 'imageGallery',
    columns,
    images,
  };
}

function ctaButtonBlock(attrs: string): unknown | null {
  const urlMatch = attrs.match(/"url"\s*:\s*"([^"]+)"/);
  const textMatch = attrs.match(/"text"\s*:\s*"([^"]+)"/);
  if (!urlMatch || !textMatch) return null;

  return {
    _key: blockKey(),
    _type: 'ctaButton',
    label: decodeHtmlEntities(textMatch[1]),
    url: decodeHtmlEntities(urlMatch[1]),
  };
}

function htmlToPortableTextBlocksOnly(html: string): unknown[] {
  const cleaned = stripWpFileBlocks(html);
  if (!cleaned?.trim()) {
    return [];
  }

  try {
    const blocks = htmlToBlocks(cleaned, blockContentType, {
      parseHtml: (h) => new JSDOM(h).window.document,
    });
    return blocks.length ? blocks : [textBlock(stripTags(cleaned))];
  } catch (err) {
    console.warn('htmlToBlocks failed, falling back to stripped text:', err);
    return [textBlock(stripTags(cleaned))];
  }
}

export function htmlToPortableText(html: string, idMap?: IdMap): unknown[] {
  if (!html?.trim()) {
    return [emptyBlock()];
  }

  if (!idMap) {
    return htmlToPortableTextBlocksOnly(html);
  }

  const segments = splitHtmlWithWpBlocks(html);
  const blocks: unknown[] = [];

  for (const segment of segments) {
    if (segment.type === 'gallery') {
      const gallery = galleryBlock(segment.content, segment.attrs, idMap);
      if (gallery) blocks.push(gallery);
      continue;
    }

    if (segment.type === 'button') {
      const button = ctaButtonBlock(segment.attrs);
      if (button) blocks.push(button);
      continue;
    }

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
