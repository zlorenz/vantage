/**
 * Patches publishedAt on all portfolioEntry documents from migration-data/portfolio.json.
 *
 * Run after schema adds publishedAt field:
 *   npx tsx scripts/migration/patch/portfolio-published-at.ts
 *
 * Requires SANITY_API_WRITE_TOKEN in .env.local.
 */

import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedPortfolio } from '../export/portfolio';
import { readJson } from '../lib/fs';
import { portfolioId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

async function main() {
  const items = readJson<ExportedPortfolio[]>(
    path.join(PATHS.migrationData, 'portfolio.json'),
  );

  let patched = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.publishedAt) {
      console.warn(`Portfolio ${item.wpId} missing publishedAt — skip`);
      skipped++;
      continue;
    }

    await patchSet(portfolioId(item.wpId), {
      publishedAt: new Date(item.publishedAt).toISOString(),
    });
    patched++;
  }

  console.log(`Patched publishedAt on ${patched} portfolio entries (${skipped} skipped).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
