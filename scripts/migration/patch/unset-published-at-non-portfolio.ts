/**
 * Unset publishedAt on page and blogPost documents.
 * Original Release Date (publishedAt) is portfolio-only.
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
    `*[_type in ["page", "blogPost"] && defined(publishedAt)]{_id, _type}`,
  );

  if (!docs.length) {
    console.log('No page/blogPost documents with publishedAt — nothing to do.');
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
