/**
 * Backfill missing `_key` on Sanity array items so Studio can edit lists.
 *
 * Migration wrote reference arrays (and some object arrays) via the API without
 * `_key`. Studio requires unique `_key` values on every array item.
 *
 * Covers:
 * - portfolioEntry: videoFormats, industries, markets, clients, crewMembers,
 *   platforms, additionalVideos, credits.*.additional
 * - blogPost: categories
 * - page: heroSlides, founders
 *
 * Usage: npx tsx scripts/migration/patch/backfill-array-keys.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import { CREDITS_CONFIG } from '../lib/credits-config';
import { getWriteClient } from '../lib/sanity-client';
import '../config';

type ArrayItem = Record<string, unknown> & { _key?: string };

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
): { items: ArrayItem[]; changed: boolean; filled: number } {
  if (!items?.length) {
    return { items: items ?? [], changed: false, filled: 0 };
  }

  const used = new Set<string>();
  let filled = 0;
  const next = items.map((item) => {
    const existing =
      typeof item._key === 'string' && item._key.length > 0 ? item._key : null;
    if (existing && !used.has(existing)) {
      used.add(existing);
      return item;
    }
    let key = newKey();
    while (used.has(key)) key = newKey();
    used.add(key);
    filled++;
    return { ...item, _key: key };
  });

  return { items: next, changed: filled > 0, filled };
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
    { _id: string; title?: string; categories?: ArrayItem[] }[]
  >(`
    *[_type == "blogPost"]{ _id, title, categories }
  `);

  const pages = await client.fetch<
    {
      _id: string;
      title?: string;
      heroSlides?: ArrayItem[];
      founders?: ArrayItem[];
    }[]
  >(`
    *[_type == "page"]{ _id, title, heroSlides, founders }
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
    const result = ensureKeys(doc.categories);
    if (!result.changed) continue;
    await client.patch(doc._id).set({ categories: result.items }).commit();
    docsPatched++;
    keysFilled += result.filled;
    console.log(
      `✓ ${doc._id}${doc.title ? ` (${doc.title})` : ''} — categories: +${result.filled} keys`,
    );
  }

  console.log(`\n=== Pages (${pages.length}) ===`);
  for (const doc of pages) {
    const patch: Record<string, unknown> = {};
    const notes: string[] = [];

    for (const field of ['heroSlides', 'founders'] as const) {
      const result = ensureKeys(doc[field]);
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
