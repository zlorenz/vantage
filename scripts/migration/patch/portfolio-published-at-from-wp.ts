/**
 * Patches publishedAt on portfolio entries by fetching post_date from WordPress.
 *
 * Use when portfolio.json lacks publishedAt (pre-export update).
 *   npx tsx scripts/migration/patch/portfolio-published-at-from-wp.ts
 */

import { fetchPosts } from '../lib/wp-helpers';
import { portfolioId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

async function main() {
  const posts = await fetchPosts('portfolio');

  for (const post of posts) {
    await patchSet(portfolioId(post.ID), {
      publishedAt: new Date(post.post_date).toISOString(),
    });
  }

  console.log(`Patched publishedAt on ${posts.length} portfolio entries from WordPress.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
