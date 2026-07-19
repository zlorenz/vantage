/**
 * Set industry parent/child relationships from WordPress taxonomy hierarchy.
 *
 * Tech (industry-tech) is parent of:
 * - AI & Robotics (industry-ai-robotics)
 * - Drones (industry-drones)
 * - Electronics (industry-electronics)
 *
 * Usage: npx tsx scripts/migration/patch/industry-parents.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import { industryId } from '../lib/ids';
import { getWriteClient } from '../lib/sanity-client';
import '../config';

const CHILDREN_BY_PARENT_SLUG: Record<string, string[]> = {
  tech: ['ai-robotics', 'drones', 'electronics'],
};

async function main() {
  const client = getWriteClient();

  console.log('=== Set industry parent references ===\n');

  for (const [parentSlug, childSlugs] of Object.entries(CHILDREN_BY_PARENT_SLUG)) {
    const parentId = industryId(parentSlug);
    const parent = await client.fetch<{ _id: string; title?: string } | null>(
      `*[_id == $id][0]{ _id, title }`,
      { id: parentId },
    );

    if (!parent) {
      console.warn(`  skip missing parent ${parentId}`);
      continue;
    }

    for (const childSlug of childSlugs) {
      const childId = industryId(childSlug);
      const child = await client.fetch<{ _id: string; title?: string } | null>(
        `*[_id == $id][0]{ _id, title }`,
        { id: childId },
      );

      if (!child) {
        console.warn(`  skip missing child ${childId}`);
        continue;
      }

      await client
        .patch(childId)
        .set({
          parent: {
            _type: 'reference',
            _ref: parentId,
          },
        })
        .commit();

      console.log(`  ${child.title} → ${parent.title}`);
    }
  }

  const tree = await client.fetch<
    { title: string; parent?: string; slug: string }[]
  >(`
    *[_type == "industry"] | order(title asc) {
      title,
      "slug": slug.current,
      "parent": parent->title
    }
  `);

  console.log('\n=== Industry tree ===');
  for (const row of tree) {
    const prefix = row.parent ? `  ↳ ` : '';
    const suffix = row.parent ? ` (under ${row.parent})` : '';
    console.log(`${prefix}${row.title}${suffix}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
