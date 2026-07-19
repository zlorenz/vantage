/**
 * Fix Vietnam Production Service guidebook CTA URL in Sanity.
 *
 *   npx tsx scripts/migration/patch/vietnam-guidebook-cta-url.ts
 */

import { pageId } from '../lib/ids';
import { getWriteClient, patchSet } from '../lib/sanity-client';

function fixCtaUrls(value: unknown): { value: unknown; changed: boolean } {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = fixCtaUrls(item);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: next, changed };
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    let changed = false;
    const next: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(obj)) {
      if (
        key === 'url' &&
        typeof child === 'string' &&
        obj._type === 'ctaButton' &&
        /vietnam-location-guide/i.test(child)
      ) {
        next[key] = '/vietnam-location-guide';
        if (child !== '/vietnam-location-guide') changed = true;
        continue;
      }
      const result = fixCtaUrls(child);
      next[key] = result.value;
      if (result.changed) changed = true;
    }
    return { value: next, changed };
  }

  return { value, changed: false };
}

async function main() {
  const client = getWriteClient();
  const doc = await client.fetch<{
    _id: string;
    body?: unknown[];
    bodyZh?: unknown[];
  } | null>(`*[_id == $id][0]{ _id, body, bodyZh }`, {
    id: pageId('vietnam-production-service'),
  });

  if (!doc) throw new Error('vietnam-production-service page missing in Sanity');

  const set: Record<string, unknown> = {};
  if (doc.body) {
    const result = fixCtaUrls(doc.body);
    if (result.changed) set.body = result.value;
  }
  if (doc.bodyZh) {
    const result = fixCtaUrls(doc.bodyZh);
    if (result.changed) set.bodyZh = result.value;
  }

  if (!Object.keys(set).length) {
    console.log('No CTA URLs needed fixing');
    return;
  }

  await patchSet(doc._id, set);
  console.log('Patched vietnam-production-service fields:', Object.keys(set));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
