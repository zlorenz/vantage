import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedTaxonomy } from '../export/taxonomies';
import { readJson } from '../lib/fs';
import {
  categoryId,
  industryId,
  marketId,
  videoFormatId,
} from '../lib/ids';
import { createOrReplace } from '../lib/sanity-client';

function slugField(slug: string) {
  return { _type: 'slug' as const, current: slug };
}

async function importTaxonomyFile(
  file: string,
  idFn: (slug: string) => string
): Promise<number> {
  const items = readJson<ExportedTaxonomy[]>(path.join(PATHS.migrationData, 'taxonomies', file));

  for (const item of items) {
    const id = idFn(item.slug);
    await createOrReplace({
      _id: id,
      _type: item.sanityType,
      title: item.title,
      ...(item.titleZh ? { titleZh: item.titleZh } : {}),
      slug: slugField(item.slug),
      ...(item.slugZh ? { slugZh: slugField(item.slugZh) } : {}),
    });
  }

  return items.length;
}

export async function importTaxonomies(): Promise<Record<string, number>> {
  const counts = {
    categories: await importTaxonomyFile('categories.json', categoryId),
    videoFormats: await importTaxonomyFile('video-formats.json', videoFormatId),
    industries: await importTaxonomyFile('industries.json', industryId),
    markets: await importTaxonomyFile('markets.json', marketId),
  };
  console.log('Imported taxonomies:', counts);
  return counts;
}
