/**
 * Seed page-home.featuredWork from the WordPress homepage portfolio-gallery
 * block IDs (vp/portfolio-gallery on front-page).
 *
 * Usage: npx tsx scripts/migration/patch/seed-home-featured-work.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import { pageId, portfolioId } from '../lib/ids';
import { getWriteClient } from '../lib/sanity-client';
import '../config';

/** From WP `vp/portfolio-gallery` ids on the Home page body. */
const FEATURED_WORK_WP_IDS = [
  3519, 3524, 3504, 3283, 3239, 3276, 3499, 3518, 3173, 3101, 2059, 3040,
] as const;

function newKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

async function main() {
  const client = getWriteClient();
  const homeId = pageId('home');

  const featuredWork = FEATURED_WORK_WP_IDS.map((wpId) => ({
    _type: 'reference' as const,
    _ref: portfolioId(wpId),
    _key: newKey(),
  }));

  await client.patch(homeId).set({ featuredWork }).commit();
  console.log(
    `Set featuredWork on ${homeId} (${featuredWork.length} refs):`,
    FEATURED_WORK_WP_IDS.join(', '),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
