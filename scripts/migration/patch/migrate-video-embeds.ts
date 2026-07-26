/**
 * Convert video-URL-only Portable Text paragraphs to first-class `videoEmbed`
 * blocks, and strip empty spacer paragraphs left from WP bootstrap rows.
 *
 * Covers blogPost + page body / bodyZh.
 *
 * Usage: npx tsx scripts/migration/patch/migrate-video-embeds.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import {
  getPortableTextBlockPlainText,
  isVideoUrlOnlyText,
  normalizeStoredVideoUrl,
} from '../../../shared/video-url';
import { getWriteClient } from '../lib/sanity-client';
import '../config';

type PtBlock = Record<string, unknown> & {
  _type?: string;
  _key?: string;
  style?: string;
  children?: Array<{ _type?: string; text?: string }>;
  url?: string;
};

function newKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

function isEmptyTextBlock(block: PtBlock): boolean {
  if (block._type !== 'block') return false;
  if (block.style && block.style !== 'normal') return false;
  const text = getPortableTextBlockPlainText(block).trim();
  return !text;
}

function migrateBody(blocks: PtBlock[] | undefined): {
  items: PtBlock[];
  changed: boolean;
  videos: number;
  emptied: number;
} {
  if (!blocks?.length) {
    return { items: blocks ?? [], changed: false, videos: 0, emptied: 0 };
  }

  let videos = 0;
  let emptied = 0;
  const next: PtBlock[] = [];

  for (const block of blocks) {
    if (isEmptyTextBlock(block)) {
      emptied++;
      continue;
    }

    if (block._type === 'block') {
      const text = getPortableTextBlockPlainText(block);
      if (isVideoUrlOnlyText(text)) {
        const url = normalizeStoredVideoUrl(text.trim().split(/\s+/)[0] ?? text.trim());
        next.push({
          _key: typeof block._key === 'string' && block._key ? block._key : newKey(),
          _type: 'videoEmbed',
          url,
        });
        videos++;
        continue;
      }
    }

    next.push(block);
  }

  const changed = videos > 0 || emptied > 0;
  return { items: next, changed, videos, emptied };
}

async function main() {
  const client = getWriteClient();

  const docs = await client.fetch<
    {
      _id: string;
      _type: string;
      title?: string;
      body?: PtBlock[];
      bodyZh?: PtBlock[];
    }[]
  >(`
    *[_type in ["blogPost", "page"]]{
      _id,
      _type,
      title,
      body,
      bodyZh
    }
  `);

  let docsPatched = 0;
  let videosConverted = 0;
  let emptiesRemoved = 0;

  for (const doc of docs) {
    const patch: Record<string, unknown> = {};
    const notes: string[] = [];

    for (const field of ['body', 'bodyZh'] as const) {
      const result = migrateBody(doc[field]);
      if (!result.changed) continue;
      patch[field] = result.items;
      notes.push(
        `${field}: ${result.videos} videoEmbed(s), ${result.emptied} empty removed`,
      );
      videosConverted += result.videos;
      emptiesRemoved += result.emptied;
    }

    if (!Object.keys(patch).length) continue;

    await client.patch(doc._id).set(patch).commit();
    docsPatched++;
    console.log(`✓ ${doc._id}${doc.title ? ` (${doc.title})` : ''}`);
    for (const note of notes) console.log(`    ${note}`);
  }

  console.log('\n--- Summary ---');
  console.log(`Documents patched: ${docsPatched}`);
  console.log(`Video embeds converted: ${videosConverted}`);
  console.log(`Empty blocks removed: ${emptiesRemoved}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
