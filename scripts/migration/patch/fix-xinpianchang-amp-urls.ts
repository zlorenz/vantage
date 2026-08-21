/**
 * One-time: decode HTML &amp; in top-level portfolioEntry.xinpianchangUrl.
 *
 * Encoded ampersands break mid= on live ZH portfolio embeds (URLSearchParams
 * treats the param as "amp;mid"). Scope is an allowlist of 9 documented IDs;
 * additionalVideos[].xinpianchangUrl is intentionally untouched (zero hits).
 *
 * Dry-run (default):
 *   npx tsx scripts/migration/patch/fix-xinpianchang-amp-urls.ts
 *
 * Apply (after review):
 *   npx tsx scripts/migration/patch/fix-xinpianchang-amp-urls.ts --apply
 *
 * --apply requires SANITY_API_WRITE_TOKEN (or SANITY_API_TOKEN) in .env.local.
 */

import {createClient} from '@sanity/client';
import {SANITY} from '../config';
import {getWriteClient} from '../lib/sanity-client';

/** Exact set from production audit — do not expand. */
const DOC_IDS = [
  'portfolio-4453',
  'portfolio-2893',
  'portfolio-2944',
  'portfolio-4a40079dd2',
  'portfolio-4522',
  'portfolio-4449',
  'portfolio-c2d5b6ab8d',
  'portfolio-3504',
  'portfolio-9fa07532e8',
] as const;

const APPLY = process.argv.includes('--apply');

type Doc = {
  _id: string;
  title?: string;
  slug?: string;
  xinpianchangUrl?: string | null;
};

function decodeAmp(url: string): string {
  return url.replace(/&amp;/gi, '&');
}

function getReadClient() {
  return createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    token: SANITY.token || undefined,
    useCdn: false,
  });
}

async function main() {
  const client = APPLY ? getWriteClient() : getReadClient();

  const docs = await client.fetch<Doc[]>(
    `*[_id in $ids]{_id, title, "slug": slug.current, xinpianchangUrl}`,
    {ids: [...DOC_IDS]},
  );

  const byId = new Map(docs.map((d) => [d._id, d]));
  const missing = DOC_IDS.filter((id) => !byId.has(id));
  if (missing.length) {
    throw new Error(`Allowlisted doc(s) not found: ${missing.join(', ')}`);
  }

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Dataset: ${SANITY.dataset}`);
  console.log(`Allowlist: ${DOC_IDS.length} docs (top-level xinpianchangUrl only)\n`);

  let wouldPatch = 0;
  let skipped = 0;

  for (const id of DOC_IDS) {
    const doc = byId.get(id)!;
    const oldUrl = doc.xinpianchangUrl?.trim() ?? '';
    if (!oldUrl) {
      console.log(`SKIP ${id} (${doc.slug ?? 'no-slug'}) — empty xinpianchangUrl`);
      skipped += 1;
      continue;
    }
    if (!/&amp;/i.test(oldUrl)) {
      console.log(`SKIP ${id} (${doc.slug ?? 'no-slug'}) — already clean`);
      skipped += 1;
      continue;
    }

    const newUrl = decodeAmp(oldUrl);
    wouldPatch += 1;
    console.log(`${APPLY ? 'PATCH' : 'WOULD PATCH'} ${id}`);
    console.log(`  title: ${doc.title ?? '(untitled)'}`);
    console.log(`  slug:  ${doc.slug ?? '(none)'}`);
    console.log(`  old:   ${oldUrl}`);
    console.log(`  new:   ${newUrl}`);

    if (APPLY) {
      await client.patch(id).set({xinpianchangUrl: newUrl}).commit();
    }
  }

  console.log(
    `\nDone. ${APPLY ? 'Patched' : 'Would patch'} ${wouldPatch}; skipped ${skipped}.`,
  );
  if (!APPLY) {
    console.log('Re-run with --apply to write patches to Sanity.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
