/**
 * Final high-risk crew name merges (user-confirmed).
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/apply-crew-name-merges-final-risk.ts
 *   npx tsx scripts/migration/patch/apply-crew-name-merges-final-risk.ts --apply
 */

import { getWriteClient } from '../lib/sanity-client';
import '../config';

interface PersonValue {
  _key?: string;
  _type?: string;
  name?: string;
  url?: string;
  linkTitle?: string;
}

interface CreditValue {
  _key?: string;
  department?: string;
  role?: string;
  roleKey?: string;
  people?: PersonValue[];
}

interface PortfolioDoc {
  _id: string;
  slug: string;
  crewCredits?: CreditValue[];
}

/**
 * Exact alias → canonical.
 * Skipped rows (A2/A3/B1/B2/C2/C15, Tú Nguyễn, Minh Thuan) are omitted.
 */
const MERGES: { from: string; to: string }[] = [
  // A1
  { from: 'Noah Tu Nguyen', to: 'Tự Nguyễn' },
  // C1 — keep bare Benjamin name
  {
    from: 'Benjamin Villataspaisarn (Basugaa Studio)',
    to: 'Benjamin Villataspaisarn',
  },
  // C3
  { from: 'Nhu Nguyen', to: 'Quỳnh Như Nguyễn Pham' },
  // C4 — only Product Technician bare Thuận; Minh Thuan skipped
  { from: 'Thuận', to: 'Lê Minh Thuận' },
  // C5
  { from: 'Khang Nguyễn', to: 'Mạnh Khang' },
  { from: 'Khang', to: 'Mạnh Khang' },
  // C6
  { from: 'Nguyen Duc Cong', to: 'Nguyễn Đức Công' },
  { from: 'Cong Nguyen', to: 'Nguyễn Đức Công' },
  { from: 'Cong', to: 'Nguyễn Đức Công' },
  // C7
  { from: 'Hippo', to: 'Vinh Nghi Hippo' },
  // C8
  { from: 'Allie', to: 'Allie Zamacona' },
  // C9
  { from: 'Pauline', to: 'Pauline Ta' },
  // C10
  { from: 'COLORSPACE', to: 'ColorSpace Vietnam' },
  // C11
  { from: 'Dylan', to: 'Dylan Ha' },
  // C12
  { from: 'Babyface', to: 'Babyface Casting' },
  // C13
  { from: 'Hi Koi', to: 'Nguyen Hi Koi Team' },
  // C14 — keep Storm Casting
  { from: 'Trần Vũ Bảo / Storm Casting', to: 'Storm Casting' },
  // C16
  { from: 'Wolfram', to: 'Wolfram Gruss' },
  // C17
  { from: 'Beez', to: 'Fat Beez' },
  // C18
  { from: 'Grace', to: 'Grace Team Sound & Lighting' },
];

const ALIAS_TO_CANONICAL = new Map(MERGES.map((m) => [m.from, m.to]));

function applyToDoc(doc: PortfolioDoc): { next: CreditValue[]; changes: string[] } {
  const credits = structuredClone(doc.crewCredits ?? []);
  const changes: string[] = [];

  for (const credit of credits) {
    if (!credit.people?.length) continue;
    const pos = `${credit.department ?? '?'} / ${credit.role ?? '?'}`;
    for (const person of credit.people) {
      const name = person.name?.trim();
      if (!name) continue;
      const canonical = ALIAS_TO_CANONICAL.get(name);
      if (!canonical || canonical === name) continue;
      person.name = canonical;
      changes.push(`${pos}: "${name}" → "${canonical}"`);
    }
  }

  return { next: credits, changes };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const client = getWriteClient();

  console.log('=== Final high-risk crew name merges ===\n');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Rename rules: ${MERGES.length}\n`);
  for (const m of MERGES) {
    console.log(`  "${m.from}" → "${m.to}"`);
  }
  console.log('');

  const docs = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
      _id,
      "slug": slug.current,
      crewCredits[]{
        _key,
        _type,
        department,
        role,
        roleKey,
        isCustomRole,
        people[]{ _key, _type, name, url, linkTitle }
      }
    }
  `);

  let docsTouched = 0;
  let renames = 0;

  for (const doc of docs) {
    const { next, changes } = applyToDoc(doc);
    if (!changes.length) continue;

    docsTouched++;
    renames += changes.length;
    console.log(`${apply ? '✓' : '·'} ${doc.slug}`);
    for (const change of changes) {
      console.log(`    ${change}`);
    }

    if (apply) {
      await client.patch(doc._id).set({ crewCredits: next }).commit();
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Portfolio entries ${apply ? 'updated' : 'would update'}: ${docsTouched}`);
  console.log(`Name renames ${apply ? 'applied' : 'pending'}: ${renames}`);
  if (!apply) {
    console.log('\nRe-run with --apply to write patches.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
