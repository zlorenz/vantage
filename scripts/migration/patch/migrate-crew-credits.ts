/**
 * Convert legacy portfolioEntry.credits into structured crewCredits.
 *
 * Dry-run by default. Pass --apply to write patches.
 *
 * Usage:
 *   npx tsx scripts/migration/patch/migrate-crew-credits.ts
 *   npx tsx scripts/migration/patch/migrate-crew-credits.ts --apply
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local for --apply.
 */

import {
  CREW_DEPARTMENTS,
  parseLegacyNamesHtml,
  type CrewCreditValue,
  type CrewDepartmentKey,
  type CrewPersonValue,
} from '../../../shared/crew-credits';
import { getWriteClient } from '../lib/sanity-client';
import '../config';

type LegacyAdditional = { _key?: string; role?: string; names?: string };
type LegacyDepartment = Record<string, string | LegacyAdditional[] | undefined>;
type LegacyCredits = Partial<Record<CrewDepartmentKey, LegacyDepartment>>;

interface PortfolioDoc {
  _id: string;
  title?: string;
  credits?: LegacyCredits;
  crewCredits?: CrewCreditValue[];
}

function newKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

export { parseLegacyNamesHtml };

export function legacyCreditsToCrewCredits(
  credits: LegacyCredits | undefined,
): CrewCreditValue[] {
  if (!credits) return [];

  const result: CrewCreditValue[] = [];

  for (const dept of CREW_DEPARTMENTS) {
    const department = credits[dept.key];
    if (!department) continue;

    for (const role of dept.roles) {
      const raw = department[role.legacyField];
      if (typeof raw !== 'string' || !raw.trim()) continue;
      const people = parseLegacyNamesHtml(raw);
      if (!people.length) continue;
      result.push({
        _type: 'crewCredit',
        _key: newKey(),
        department: dept.key,
        roleKey: role.key,
        role: role.label,
        isCustomRole: false,
        people,
      });
    }

    const additional = department.additional ?? department[dept.legacyRepeater];
    if (!Array.isArray(additional)) continue;

    for (const row of additional) {
      const roleLabel = String(row.role ?? '').trim();
      const namesRaw = String(row.names ?? '').trim();
      if (!roleLabel || !namesRaw) continue;
      const people = parseLegacyNamesHtml(namesRaw);
      if (!people.length) continue;

      result.push({
        _type: 'crewCredit',
        _key: row._key || newKey(),
        department: dept.key,
        role: roleLabel,
        isCustomRole: true,
        people,
      });
    }
  }

  return result;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const client = getWriteClient();

  const docs = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry"] | order(title asc) {
      _id,
      title,
      credits,
      crewCredits
    }
  `);

  let wouldWrite = 0;
  let skippedExisting = 0;
  let skippedEmpty = 0;

  for (const doc of docs) {
    if (doc.crewCredits && doc.crewCredits.length > 0) {
      skippedExisting++;
      continue;
    }

    const converted = legacyCreditsToCrewCredits(doc.credits);
    if (!converted.length) {
      skippedEmpty++;
      continue;
    }

    wouldWrite++;
    console.log(
      `${apply ? 'WRITE' : 'DRY'} ${doc._id} (${doc.title ?? 'untitled'}) → ${converted.length} credits`,
    );

    if (apply) {
      await client.patch(doc._id).set({ crewCredits: converted }).commit();
    }
  }

  console.log(
    `\nDone. ${apply ? 'Wrote' : 'Would write'} ${wouldWrite}; skipped existing ${skippedExisting}; skipped empty ${skippedEmpty}; total ${docs.length}.`,
  );
  if (!apply && wouldWrite > 0) {
    console.log('Re-run with --apply to patch Sanity.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
