/**
 * Write improved portfolioEntry.slugZh values into Sanity (+ fix page.work.slugZh).
 *
 * Sources: migration-data/portfolio-slugzh-improved.json
 * (titleZh slugified + curated overrides; replaces missing/awkward live TRP slugs)
 *
 *   npx tsx scripts/migration/patch/portfolio-slug-zh.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local
 */

import path from 'node:path';

import { PATHS } from '../config';
import { readJson } from '../lib/fs';
import { pageId } from '../lib/ids';
import { getWriteClient } from '../lib/sanity-client';

interface ImprovedEntry {
  _id: string;
  slug: string;
  slugZh: string;
  previousSlugZh?: string | null;
}

interface ImprovedFile {
  entries: ImprovedEntry[];
}

function slugField(current: string) {
  return { _type: 'slug', current };
}

async function main() {
  const filePath = path.join(PATHS.migrationData, 'portfolio-slugzh-improved.json');
  const data = readJson<ImprovedFile>(filePath);
  const client = getWriteClient();

  let tx = client.transaction();
  let updated = 0;
  let skipped = 0;

  for (const entry of data.entries) {
    if (!entry.slugZh) {
      skipped += 1;
      continue;
    }
    if (entry.previousSlugZh === entry.slugZh) {
      skipped += 1;
      continue;
    }

    tx = tx.patch(entry._id, { set: { slugZh: slugField(entry.slugZh) } });
    updated += 1;
    console.log(`Queue ${entry.slug} → ${entry.slugZh}`);
  }

  tx = tx.patch(pageId('work'), { set: { slugZh: slugField('工作') } });
  console.log('Queue page-work slugZh → 工作');

  await tx.commit({ visibility: 'async' });
  console.log(`Committed. updated=${updated} skipped=${skipped} (+ page-work)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
