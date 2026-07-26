/**
 * Seed page-vietnam-production-service.featuredWork from the current
 * “Shot in Vietnam” gallery (all public portfolio entries tagged Vietnam),
 * preserving display order (publishedAt desc).
 *
 * Usage: npx tsx scripts/migration/patch/seed-vps-featured-work.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import { pageId } from '../lib/ids';
import { getWriteClient } from '../lib/sanity-client';
import '../config';

function newKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

async function main() {
  const client = getWriteClient();
  const pageDocId = pageId('vietnam-production-service');

  const marketId = await client.fetch<string | null>(
    `*[_type == "market" && slug.current == "vietnam" && !defined(trash.trashedAt)][0]._id`,
  );
  if (!marketId) {
    throw new Error('market-vietnam not found');
  }

  const entries = await client.fetch<{ _id: string; slug?: string }[]>(
    `*[_type == "portfolioEntry" && isHidden != true && !defined(trash.trashedAt) && references($termId)]
      | order(publishedAt desc, title asc) {
        _id,
        "slug": slug.current
      }`,
    { termId: marketId },
  );

  if (!entries.length) {
    throw new Error('No Vietnam-tagged portfolio entries to seed');
  }

  const featuredWork = entries.map((entry) => ({
    _type: 'reference' as const,
    _ref: entry._id,
    _key: newKey(),
  }));

  await client.patch(pageDocId).set({ featuredWork }).commit();
  console.log(
    `Set featuredWork on ${pageDocId} (${featuredWork.length} refs):`,
    entries.map((e) => e.slug ?? e._id).join(', '),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
