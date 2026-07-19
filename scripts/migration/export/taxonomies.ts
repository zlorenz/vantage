import path from 'node:path';
import { PATHS } from '../config';
import { writeJson } from '../lib/fs';
import { fetchTerms } from '../lib/wp-helpers';
import { translate } from '../lib/translatepress';

export interface ExportedTaxonomy {
  wpTermId: number;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  sanityType: string;
  parentWpTermId?: number;
  parentSlug?: string;
}

const TAXONOMY_MAP: Record<string, string> = {
  category: 'category',
  'video-format': 'videoFormat',
  industry: 'industry',
  market: 'market',
};

export async function exportTaxonomies(): Promise<{
  categories: ExportedTaxonomy[];
  videoFormats: ExportedTaxonomy[];
  industries: ExportedTaxonomy[];
  markets: ExportedTaxonomy[];
}> {
  const terms = await fetchTerms(Object.keys(TAXONOMY_MAP));
  const slugByTermId = new Map(terms.map((term) => [term.termId, term.slug]));

  const exported: ExportedTaxonomy[] = [];
  for (const term of terms) {
    const titleZh = await translate(term.name);
    const slugZh = await translate(term.slug);
    const parentSlug =
      term.parentTermId > 0 ? slugByTermId.get(term.parentTermId) : undefined;
    exported.push({
      wpTermId: term.termId,
      title: term.name,
      titleZh,
      slug: term.slug,
      slugZh: slugZh && slugZh !== term.slug ? slugZh : undefined,
      sanityType: TAXONOMY_MAP[term.taxonomy],
      ...(term.parentTermId > 0
        ? { parentWpTermId: term.parentTermId, parentSlug }
        : {}),
    });
  }

  const categories = exported.filter((t) => t.sanityType === 'category');
  const videoFormats = exported.filter((t) => t.sanityType === 'videoFormat');
  const industries = exported.filter((t) => t.sanityType === 'industry');
  const markets = exported.filter((t) => t.sanityType === 'market');

  const outDir = path.join(PATHS.migrationData, 'taxonomies');
  writeJson(path.join(outDir, 'categories.json'), categories);
  writeJson(path.join(outDir, 'video-formats.json'), videoFormats);
  writeJson(path.join(outDir, 'industries.json'), industries);
  writeJson(path.join(outDir, 'markets.json'), markets);

  return { categories, videoFormats, industries, markets };
}
