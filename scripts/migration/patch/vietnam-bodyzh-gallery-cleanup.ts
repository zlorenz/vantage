/**
 * Clean Vietnam Production Service bodyZh:
 * - remove collapsed gallery-caption paragraphs
 * - drop English figcaptions from imageGallery (alts stay for a11y)
 *
 *   npx tsx scripts/migration/patch/vietnam-bodyzh-gallery-cleanup.ts
 */

import { filterVietnamProductionServiceBody } from '../../../src/lib/portable-text-filters';
import { pageId } from '../lib/ids';
import { getWriteClient, patchSet } from '../lib/sanity-client';
import type { PortableTextBlock } from '../../../src/types/sanity';

function stripGalleryCaptions(blocks: unknown[]): unknown[] {
  return blocks.map((block) => {
    if (!block || typeof block !== 'object') return block;
    const typed = block as {
      _type?: string;
      images?: Array<Record<string, unknown>>;
    };
    if (typed._type !== 'imageGallery' || !Array.isArray(typed.images)) {
      return block;
    }

    return {
      ...typed,
      images: typed.images.map((image) => {
        const next = { ...image };
        delete next.caption;
        // Prefer empty alt on ZH to avoid screen-reader dumping English blurbs
        // into copy/paste extractions page text.
        if (typeof next.alt === 'string' && next.alt.length > 40) {
          next.alt = '';
        }
        return next;
      }),
    };
  });
}

async function main() {
  const client = getWriteClient();
  const doc = await client.fetch<{ bodyZh?: PortableTextBlock[] } | null>(
    `*[_id == $id][0]{ bodyZh }`,
    { id: pageId('vietnam-production-service') },
  );

  if (!doc?.bodyZh?.length) {
    throw new Error('bodyZh missing on vietnam-production-service');
  }

  const filtered =
    filterVietnamProductionServiceBody(doc.bodyZh) ?? doc.bodyZh;
  const cleaned = stripGalleryCaptions(filtered);

  await patchSet(pageId('vietnam-production-service'), { bodyZh: cleaned });
  console.log(
    `Patched bodyZh: ${doc.bodyZh.length} → ${cleaned.length} blocks (captions stripped)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
