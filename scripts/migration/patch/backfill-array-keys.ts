/**
 * Backfill missing `_key` on Sanity array items so Studio can edit lists.
 *
 * Migration wrote reference arrays (and some object arrays) via the API without
 * `_key`. Studio requires unique `_key` values on every array item.
 *
 * Covers:
 * - portfolioEntry: videoFormats, industries, markets, clients, crewMembers,
 *   platforms, additionalVideos, credits.*.additional
 * - blogPost: categories, body, bodyZh (incl. nested children/markDefs)
 * - page: heroSlides, featuredWork, brandLogos, founders, body, bodyZh (incl. nested children/markDefs)
 *
 * Usage: npx tsx scripts/migration/patch/backfill-array-keys.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import { CREDITS_CONFIG } from '../lib/credits-config';
import { getWriteClient } from '../lib/sanity-client';
import '../config';

type ArrayItem = Record<string, unknown> & {
  _key?: string;
  children?: ArrayItem[];
  markDefs?: ArrayItem[];
};

const PORTFOLIO_REF_FIELDS = [
  'videoFormats',
  'industries',
  'markets',
  'clients',
  'crewMembers',
  'platforms',
] as const;

function newKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

function ensureKeys(
  items: ArrayItem[] | undefined,
  opts: { deep?: boolean } = {},
): { items: ArrayItem[]; changed: boolean; filled: number } {
  if (!items?.length) {
    return { items: items ?? [], changed: false, filled: 0 };
  }

  const used = new Set<string>();
  let filled = 0;
  const next = items.map((item) => {
    let current = item;
    const existing =
      typeof current._key === 'string' && current._key.length > 0
        ? current._key
        : null;
    if (existing && !used.has(existing)) {
      used.add(existing);
    } else {
      let key = newKey();
      while (used.has(key)) key = newKey();
      used.add(key);
      filled++;
      current = {...current, _key: key};
    }

    if (opts.deep) {
      if (Array.isArray(current.children)) {
        const children = ensureKeys(current.children, {deep: true});
        if (children.changed) {
          current = {...current, children: children.items};
          filled += children.filled;
        }
      }
      if (Array.isArray(current.markDefs)) {
        const markDefs = ensureKeys(current.markDefs, {deep: true});
        if (markDefs.changed) {
          current = {...current, markDefs: markDefs.items};
          filled += markDefs.filled;
        }
      }
    }

    return current;
  });

  return {items: next, changed: filled > 0, filled};
}

async function main() {
  const client = getWriteClient();

  const portfolios = await client.fetch<
    {
      _id: string;
      title?: string;
      videoFormats?: ArrayItem[];
      industries?: ArrayItem[];
      markets?: ArrayItem[];
      clients?: ArrayItem[];
      crewMembers?: ArrayItem[];
      platforms?: ArrayItem[];
      additionalVideos?: ArrayItem[];
      credits?: Record<string, { additional?: ArrayItem[] }>;
    }[]
  >(`
    *[_type == "portfolioEntry"]{
      _id,
      title,
      videoFormats,
      industries,
      markets,
      clients,
      crewMembers,
      platforms,
      additionalVideos,
      credits
    }
  `);

  const blogs = await client.fetch<
    {
      _id: string;
      title?: string;
      categories?: ArrayItem[];
      body?: ArrayItem[];
      bodyZh?: ArrayItem[];
    }[]
  >(`
    *[_type == "blogPost"]{ _id, title, categories, body, bodyZh }
  `);

  const pages = await client.fetch<
    {
      _id: string;
      title?: string;
      heroSlides?: ArrayItem[];
      featuredWork?: ArrayItem[];
      brandLogos?: ArrayItem[];
      founders?: ArrayItem[];
      body?: ArrayItem[];
      bodyZh?: ArrayItem[];
    }[]
  >(`
    *[_type == "page"]{ _id, title, heroSlides, featuredWork, brandLogos, founders, body, bodyZh }
  `);

  let docsPatched = 0;
  let keysFilled = 0;

  console.log(`=== Portfolio entries (${portfolios.length}) ===`);
  for (const doc of portfolios) {
    const patch: Record<string, unknown> = {};
    const notes: string[] = [];

    for (const field of PORTFOLIO_REF_FIELDS) {
      const result = ensureKeys(doc[field]);
      if (result.changed) {
        patch[field] = result.items;
        notes.push(`${field}: +${result.filled} keys`);
        keysFilled += result.filled;
      }
    }

    const av = ensureKeys(doc.additionalVideos);
    if (av.changed) {
      patch.additionalVideos = av.items;
      notes.push(`additionalVideos: +${av.filled} keys`);
      keysFilled += av.filled;
    }

    if (doc.credits) {
      const nextCredits = structuredClone(doc.credits);
      let creditsChanged = false;
      for (const dept of Object.keys(CREDITS_CONFIG)) {
        const additional = nextCredits[dept]?.additional;
        if (!additional?.length) continue;
        const result = ensureKeys(additional);
        if (result.changed) {
          nextCredits[dept]!.additional = result.items;
          notes.push(`credits.${dept}.additional: +${result.filled} keys`);
          keysFilled += result.filled;
          creditsChanged = true;
        }
      }
      if (creditsChanged) patch.credits = nextCredits;
    }

    if (!Object.keys(patch).length) continue;

    await client.patch(doc._id).set(patch).commit();
    docsPatched++;
    console.log(`✓ ${doc._id}${doc.title ? ` (${doc.title})` : ''}`);
    for (const note of notes) console.log(`    ${note}`);
  }

  console.log(`\n=== Blog posts (${blogs.length}) ===`);
  for (const doc of blogs) {
    const patch: Record<string, unknown> = {};
    const notes: string[] = [];

    const categories = ensureKeys(doc.categories);
    if (categories.changed) {
      patch.categories = categories.items;
      notes.push(`categories: +${categories.filled} keys`);
      keysFilled += categories.filled;
    }

    for (const field of ['body', 'bodyZh'] as const) {
      const result = ensureKeys(doc[field], {deep: true});
      if (result.changed) {
        patch[field] = result.items;
        notes.push(`${field}: +${result.filled} keys`);
        keysFilled += result.filled;
      }
    }

    if (!Object.keys(patch).length) continue;

    await client.patch(doc._id).set(patch).commit();
    docsPatched++;
    console.log(`✓ ${doc._id}${doc.title ? ` (${doc.title})` : ''}`);
    for (const note of notes) console.log(`    ${note}`);
  }

  console.log(`\n=== Pages (${pages.length}) ===`);
  for (const doc of pages) {
    const patch: Record<string, unknown> = {};
    const notes: string[] = [];

    for (const field of ['heroSlides', 'featuredWork', 'brandLogos', 'founders'] as const) {
      const result = ensureKeys(doc[field]);
      if (result.changed) {
        patch[field] = result.items;
        notes.push(`${field}: +${result.filled} keys`);
        keysFilled += result.filled;
      }
    }

    for (const field of ['body', 'bodyZh'] as const) {
      const result = ensureKeys(doc[field], {deep: true});
      if (result.changed) {
        patch[field] = result.items;
        notes.push(`${field}: +${result.filled} keys`);
        keysFilled += result.filled;
      }
    }

    if (!Object.keys(patch).length) continue;

    await client.patch(doc._id).set(patch).commit();
    docsPatched++;
    console.log(`✓ ${doc._id}${doc.title ? ` (${doc.title})` : ''}`);
    for (const note of notes) console.log(`    ${note}`);
  }

  console.log('\n--- Summary ---');
  console.log(`Documents patched: ${docsPatched}`);
  console.log(`_key values filled: ${keysFilled}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
