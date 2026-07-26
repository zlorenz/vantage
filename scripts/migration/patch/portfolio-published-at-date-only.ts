/**
 * Strip time from portfolioEntry.publishedAt (datetime → date).
 *
 * Sanity `date` fields store `YYYY-MM-DD`. Existing values are ISO datetimes
 * from WordPress; this keeps the calendar day from the stored timestamp.
 *
 *   npx tsx scripts/migration/patch/portfolio-published-at-date-only.ts
 *
 * Requires SANITY_API_WRITE_TOKEN in .env.local.
 * Pass --dry-run to preview without writing.
 */

import { getWriteClient } from '../lib/sanity-client';

type Row = {_id: string; publishedAt?: string};

function toDateOnly(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const client = getWriteClient();

  const rows = await client.fetch<Row[]>(
    `*[_type == "portfolioEntry" && defined(publishedAt)]{_id, publishedAt}`,
  );

  let patched = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.publishedAt) {
      skipped++;
      continue;
    }

    const next = toDateOnly(row.publishedAt);
    if (!next) {
      console.warn(`Skip ${row._id}: unparseable publishedAt "${row.publishedAt}"`);
      skipped++;
      continue;
    }

    if (next === row.publishedAt) {
      skipped++;
      continue;
    }

    console.log(`${dryRun ? '[dry-run] ' : ''}${row._id}: ${row.publishedAt} → ${next}`);
    if (!dryRun) {
      await client.patch(row._id).set({publishedAt: next}).commit({autoGenerateArrayKeys: true});
    }
    patched++;
  }

  console.log(
    `${dryRun ? 'Would patch' : 'Patched'} ${patched} portfolio entries (${skipped} already date-only or skipped).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
