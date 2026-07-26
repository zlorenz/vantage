/**
 * Apply confirmed cross-position crew name merges.
 *
 * Renames alias spellings to canonical forms across ALL crew positions
 * (except the EP special-case for Tu Nguyen → Tú Nguyễn).
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/apply-crew-name-merges-cross-position.ts
 *   npx tsx scripts/migration/patch/apply-crew-name-merges-cross-position.ts --apply
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

/** Global alias → canonical (exact name match). */
const GLOBAL_MERGES: { from: string; to: string }[] = [
  // High
  { from: 'Nguyen Viet Anh', to: 'Việt Anh Nguyễn' },
  { from: 'Huy Le', to: 'Huy Lê' },
  { from: 'Rika Trang Nham', to: 'Rika Trang Nhâm' },
  { from: 'Meccanica Efx', to: 'Meccanica EFX' },
  { from: 'Nga Huynh', to: 'Huynh Nga' },
  { from: 'Duy Vk', to: 'Duy VK' },
  { from: 'Thippawan Aekkarin', to: 'Aekkarin Thippawan' },
  { from: 'Gonpop', to: 'GonPop' },
  { from: 'Anh Pham', to: 'Anh Phạm' },
  { from: 'Khang Nguyen', to: 'Khang Nguyễn' },
  // Review
  { from: 'Ha Nguyen', to: 'Hà Nguyễn' },
  { from: 'Yen Vi', to: 'Yến Vi' },
  { from: 'Quyen Nguyen', to: 'Quyên Nguyễn' },
  { from: 'Thach Thao', to: 'Thạch Thảo' },
  { from: 'Le Mai Anh', to: 'Lê Mai Anh' },
  { from: 'Tuyen Ngoc', to: 'Tuyên Ngọc' },
  { from: 'Nguyen The Huy', to: 'Nguyễn Thế Huy' },
];

function isEpCredit(credit: CreditValue): boolean {
  const roleKey = credit.roleKey?.trim().toLowerCase();
  if (roleKey === 'ep') return true;
  const role = credit.role?.trim().toLowerCase() ?? '';
  return role === 'ep' || role === 'executive producer';
}

/** Resolve canonical for a person name within a credit row. */
function resolveCanonical(name: string, credit: CreditValue): string | null {
  // Split rule: Tu Nguyen → Tú Nguyễn under EP, otherwise Tự Nguyễn
  if (name === 'Tu Nguyen') {
    return isEpCredit(credit) ? 'Tú Nguyễn' : 'Tự Nguyễn';
  }
  const hit = GLOBAL_MERGES.find((m) => m.from === name);
  return hit?.to ?? null;
}

function applyToDoc(doc: PortfolioDoc): { next: CreditValue[]; changes: string[] } {
  const credits = structuredClone(doc.crewCredits ?? []);
  const changes: string[] = [];

  for (const credit of credits) {
    if (!credit.people?.length) continue;
    const pos = `${credit.department ?? '?'} / ${credit.role ?? '?'}`;
    for (const person of credit.people) {
      const name = person.name?.trim();
      if (!name) continue;
      const canonical = resolveCanonical(name, credit);
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

  console.log('=== Cross-position crew name merges ===\n');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Global rename rules: ${GLOBAL_MERGES.length}`);
  console.log('Special: "Tu Nguyen" → "Tú Nguyễn" if EP, else "Tự Nguyễn"\n');

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
