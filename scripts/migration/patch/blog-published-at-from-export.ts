/**
 * Backfill publishedAt on blogPost documents from migration-data/blog-posts.json.
 *
 * Matches via blogPostId(wpId) — same key as scripts/migration/import/blog-posts.ts.
 *
 *   npx tsx scripts/migration/patch/blog-published-at-from-export.ts --dry-run
 *   npx tsx scripts/migration/patch/blog-published-at-from-export.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import path from 'node:path';

import {PATHS} from '../config';
import type {ExportedBlogPost} from '../export/blog-posts';
import {readJson} from '../lib/fs';
import {blogPostId} from '../lib/ids';
import {getWriteClient, patchSet} from '../lib/sanity-client';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const items = readJson<ExportedBlogPost[]>(
    path.join(PATHS.migrationData, 'blog-posts.json'),
  );
  const client = getWriteClient();

  console.log(
    `${dryRun ? '[dry-run] ' : ''}Backfilling publishedAt on ${items.length} blog posts…`,
  );

  let patched = 0;
  let missing = 0;

  for (const item of items) {
    const id = blogPostId(item.wpId);
    const next = new Date(item.publishedAt).toISOString();

    const before = await client.fetch<{
      _id: string;
      slug?: string;
      publishedAt?: string;
      _createdAt?: string;
    } | null>(
      `*[_id == $id][0]{_id, "slug": slug.current, publishedAt, _createdAt}`,
      {id},
    );

    if (!before) {
      console.warn(`MISSING ${id} (wpId ${item.wpId}, slug ${item.slug}) — skip`);
      missing += 1;
      continue;
    }

    console.log(
      `${dryRun ? '[dry-run] ' : ''}${id}  slug=${before.slug ?? item.slug}\n` +
        `  before publishedAt=${before.publishedAt ?? '(unset)'}  _createdAt=${before._createdAt ?? '(n/a)'}\n` +
        `  after  publishedAt=${next}  (export ${item.publishedAt})`,
    );

    if (!dryRun) {
      await patchSet(id, {publishedAt: next});
    }
    patched += 1;
  }

  console.log(
    `${dryRun ? '[dry-run] ' : ''}Done. ${patched} patched, ${missing} missing.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
