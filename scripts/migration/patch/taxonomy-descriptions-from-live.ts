/**
 * Backfill portfolio taxonomy archive intro paragraphs from live WP term descriptions.
 *
 * Source: migration-data/taxonomies/descriptions-from-live.json
 * (exported from https://vantage.pictures WP REST API, EN + ZH)
 *
 *   npx tsx scripts/migration/patch/taxonomy-descriptions-from-live.ts
 */

import path from 'node:path';
import { PATHS } from '../config';
import { readJson } from '../lib/fs';
import { getWriteClient, patchSet } from '../lib/sanity-client';

interface TaxonomyDescription {
  sanityType: string;
  slug: string;
  description: string;
  descriptionZh: string;
}

async function main() {
  const items = readJson<TaxonomyDescription[]>(
    path.join(PATHS.migrationData, 'taxonomies', 'descriptions-from-live.json'),
  );
  const client = getWriteClient();
  let n = 0;

  for (const item of items) {
    if (!item.description && !item.descriptionZh) {
      console.warn(`Empty descriptions for ${item.sanityType}/${item.slug}`);
      continue;
    }

    const doc = await client.fetch<{ _id: string } | null>(
      `*[_type==$type && slug.current==$slug][0]{_id}`,
      { type: item.sanityType, slug: item.slug },
    );

    if (!doc?._id) {
      console.warn(`Missing ${item.sanityType}/${item.slug}`);
      continue;
    }

    const set: Record<string, string> = {};
    if (item.description) set.description = item.description;
    if (item.descriptionZh) set.descriptionZh = item.descriptionZh;

    await patchSet(doc._id, set);
    n += 1;
    console.log(`Patched ${item.sanityType}/${item.slug}`);
  }

  console.log(`\nDone. ${n} taxonomy docs patched with descriptions.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
