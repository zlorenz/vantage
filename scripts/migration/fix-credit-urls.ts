/**
 * One-time fix: replace localhost WordPress URLs in portfolio credit fields.
 *
 * Finds credit string values containing http://localhost:8888/vantage-local/
 * and patches them to https://vantage.pictures/ in Sanity.
 *
 * Usage: npx tsx scripts/migration/fix-credit-urls.ts
 *
 * Requires SANITY_API_TOKEN (or SANITY_API_WRITE_TOKEN) in .env.local.
 */

import { CREDITS_CONFIG } from './lib/credits-config';
import { getWriteClient } from './lib/sanity-client';
import './config';

const OLD_URL = 'http://localhost:8888/vantage-local/';
const NEW_URL = 'https://vantage.pictures/';

const PORTFOLIO_CREDITS_QUERY = `
  *[_type == "portfolioEntry" && defined(credits)]{
    _id,
    title,
    "slug": slug.current,
    credits
  }
`;

interface PortfolioDoc {
  _id: string;
  title: string;
  slug: string;
  credits: Record<string, Record<string, unknown>>;
}

function fixString(value: unknown): { value: string; changed: boolean } {
  if (typeof value !== 'string' || !value.includes(OLD_URL)) {
    return { value: typeof value === 'string' ? value : '', changed: false };
  }
  return {
    value: value.replaceAll(OLD_URL, NEW_URL),
    changed: true,
  };
}

function fixCredits(credits: Record<string, Record<string, unknown>>): {
  fixed: Record<string, Record<string, unknown>>;
  paths: string[];
} {
  const fixed = structuredClone(credits);
  const paths: string[] = [];

  for (const [dept, config] of Object.entries(CREDITS_CONFIG)) {
    const deptData = fixed[dept];
    if (!deptData) continue;

    for (const field of config.fields) {
      const result = fixString(deptData[field]);
      if (result.changed) {
        deptData[field] = result.value;
        paths.push(`credits.${dept}.${field}`);
      }
    }

    const additional = deptData.additional;
    if (!Array.isArray(additional)) continue;

    for (let i = 0; i < additional.length; i++) {
      const row = additional[i] as { role?: string; names?: string };

      if (row.names) {
        const namesResult = fixString(row.names);
        if (namesResult.changed) {
          row.names = namesResult.value;
          paths.push(`credits.${dept}.additional[${i}].names`);
        }
      }

      if (row.role) {
        const roleResult = fixString(row.role);
        if (roleResult.changed) {
          row.role = roleResult.value;
          paths.push(`credits.${dept}.additional[${i}].role`);
        }
      }
    }
  }

  return { fixed, paths };
}

async function main() {
  const client = getWriteClient();
  const docs = await client.fetch<PortfolioDoc[]>(PORTFOLIO_CREDITS_QUERY);

  console.log(`Scanned ${docs.length} portfolio entries with credits.\n`);

  let updatedCount = 0;
  const report: { slug: string; title: string; fields: string[] }[] = [];

  for (const doc of docs) {
    const { fixed, paths } = fixCredits(doc.credits);
    if (!paths.length) continue;

    await client.patch(doc._id).set({ credits: fixed }).commit();

    updatedCount++;
    report.push({ slug: doc.slug, title: doc.title, fields: paths });
    console.log(`✓ ${doc.slug}`);
    for (const path of paths) {
      console.log(`    ${path}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Documents updated: ${updatedCount}`);
  console.log(`Fields patched: ${report.reduce((n, r) => n + r.fields.length, 0)}`);

  if (!updatedCount) {
    console.log('No localhost credit URLs found — nothing to patch.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
