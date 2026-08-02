/**
 * Unset publishedAt on page documents only.
 *
 * Historically this also unset blogPost.publishedAt when that field was
 * treated as portfolio-only. Blog posts now use publishedAt again (WP
 * post_date) — do NOT include blogPost here or a re-run will wipe the
 * backfill from blog-published-at-from-export.ts.
 *
 * Usage: npx tsx scripts/migration/patch/unset-published-at-non-portfolio.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import { getWriteClient } from '../lib/sanity-client';
import '../config';

async function main() {
  const client = getWriteClient();

  const docs = await client.fetch<{ _id: string; _type: string }[]>(
    `*[_type == "page" && defined(publishedAt)]{_id, _type}`,
  );

  if (!docs.length) {
    console.log('No page documents with publishedAt — nothing to do.');
    return;
  }

  let patched = 0;
  for (const doc of docs) {
    await client.patch(doc._id).unset(['publishedAt']).commit();
    patched += 1;
    console.log(`Unset publishedAt on ${doc._id} (${doc._type})`);
  }

  console.log(`Done. Unset publishedAt on ${patched} document(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
