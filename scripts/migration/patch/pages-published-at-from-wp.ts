/**
 * Patches publishedAt on page documents by fetching post_date from WordPress.
 *
 * Also updates migration-data/pages.json so re-imports keep the dates.
 *   npx tsx scripts/migration/patch/pages-published-at-from-wp.ts
 */

import path from 'node:path';
import { PATHS } from '../config';
import { closePool } from '../db';
import type { ExportedPage } from '../export/pages';
import { readJson, writeJson } from '../lib/fs';
import { pageId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';
import { fetchPosts } from '../lib/wp-helpers';

async function main() {
  const posts = await fetchPosts('page');
  const pagesPath = path.join(PATHS.migrationData, 'pages.json');
  const exported = readJson<ExportedPage[]>(pagesPath);
  const byWpId = new Map(exported.map((p) => [p.wpId, p]));

  let patched = 0;
  for (const post of posts) {
    const publishedAt = new Date(post.post_date).toISOString();
    const id = pageId(post.post_name);
    await patchSet(id, { publishedAt });
    patched += 1;
    console.log(`✓ ${id} ← ${post.post_date}`);

    const item = byWpId.get(post.ID);
    if (item) item.publishedAt = post.post_date;
  }

  writeJson(pagesPath, exported);
  console.log(`Patched publishedAt on ${patched} pages from WordPress.`);
  await closePool();
}

main().catch(async (err) => {
  console.error(err);
  await closePool().catch(() => undefined);
  process.exit(1);
});
