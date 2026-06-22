/**
 * Patches excerpt + excerptZh on portfolio entries from WordPress post_excerpt.
 *
 *   npx tsx scripts/migration/patch/portfolio-excerpt-from-wp.ts
 */

import { fetchPosts } from '../lib/wp-helpers';
import { portfolioId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';
import { translate } from '../lib/translatepress';

async function main() {
  const posts = await fetchPosts('portfolio');
  let patched = 0;

  for (const post of posts) {
    const excerpt = (post.post_excerpt ?? '').trim();
    if (!excerpt) continue;

    const excerptZh = await translate(excerpt);
    const fields: Record<string, string> = { excerpt };
    if (excerptZh && excerptZh !== excerpt) fields.excerptZh = excerptZh;

    await patchSet(portfolioId(post.ID), fields);
    patched += 1;
  }

  console.log(`Patched excerpt on ${patched} portfolio entries from WordPress.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
