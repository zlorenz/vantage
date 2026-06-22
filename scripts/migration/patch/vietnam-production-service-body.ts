/**
 * Re-imports Vietnam Production Service body with gallery + button blocks.
 *
 *   npx tsx scripts/migration/patch/vietnam-production-service-body.ts
 */

import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedPage } from '../export/pages';
import { readJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { pageId } from '../lib/ids';
import { loadIdMap } from '../lib/id-map';
import { patchSet } from '../lib/sanity-client';

async function main() {
  const pages = readJson<ExportedPage[]>(path.join(PATHS.migrationData, 'pages.json'));
  const item = pages.find((page) => page.slug === 'vietnam-production-service');

  if (!item) {
    throw new Error('vietnam-production-service page not found in pages.json');
  }

  const idMap = loadIdMap();
  const body = htmlToPortableText(item.bodyHtml, idMap);

  await patchSet(pageId('vietnam-production-service'), { body });

  const types = [...new Set(body.map((block) => (block as { _type?: string })._type))];
  console.log(
    `Patched Vietnam Production Service body (${body.length} blocks). Types: ${types.join(', ')}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
