/**
 * Removes wp:file migration artifact from Vietnam Location Guide body in Sanity.
 *
 *   npx tsx scripts/migration/patch/vietnam-location-guide-body.ts
 */

import { pageId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

type PtBlock = {
  _type: string;
  children?: Array<{ text?: string }>;
};

function isPdfArtifact(block: PtBlock): boolean {
  if (block._type !== 'block') return false;
  const text = (block.children ?? []).map((c) => c.text ?? '').join('');
  return /\.pdfdownload$/i.test(text.replace(/\s+/g, ''));
}

async function main() {
  const { createClient } = await import('@sanity/client');
  const { SANITY } = await import('../config');

  const client = createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: SANITY.token,
    useCdn: false,
  });

  const doc = await client.fetch<{ body?: PtBlock[] }>(
    `*[_type == "page" && slug.current == "vietnam-location-guide"][0]{ body }`,
  );

  if (!doc?.body?.length) {
    console.log('No body found — nothing to patch.');
    return;
  }

  const filtered = doc.body.filter((block) => !isPdfArtifact(block));
  if (filtered.length === doc.body.length) {
    console.log('No PDF artifact block found — already clean.');
    return;
  }

  await patchSet(pageId('vietnam-location-guide'), { body: filtered });
  console.log(
    `Removed ${doc.body.length - filtered.length} PDF artifact block(s) from Vietnam Location Guide.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
