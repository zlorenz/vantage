/**
 * Apply approved crew-name merges within matching crew positions.
 *
 * Reads the latest audit report, applies user overrides / skips, then rewrites
 * crewCredits[].people[].name only when department + role(+roleKey) match.
 *
 * Dry-run by default:
 *   npx tsx scripts/migration/patch/apply-crew-name-merges.ts
 *   npx tsx scripts/migration/patch/apply-crew-name-merges.ts --apply
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local for --apply.
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizeCreditToken } from '../../../shared/crew-credits';
import { getWriteClient } from '../lib/sanity-client';
import { PATHS } from '../config';
import '../config';

interface AuditVariant {
  name: string;
  count: number;
}

interface AuditGroup {
  position: {
    department: string;
    role: string;
    roleKey?: string;
  };
  positionLabel: string;
  confidence: 'high' | 'medium' | 'review';
  suggestedCanonical: string;
  variants: AuditVariant[];
}

interface AuditReport {
  groups: AuditGroup[];
}

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
  title?: string;
  slug: string;
  crewCredits?: CreditValue[];
}

interface MergeRule {
  department: string;
  role: string;
  roleKey?: string;
  positionLabel: string;
  canonical: string;
  aliases: string[];
}

/** User-confirmed overrides / skips on top of the audit report. */
const CANONICAL_OVERRIDES: {
  department: string;
  role: string;
  fromSuggested: string;
  to: string;
}[] = [
  {
    department: 'casting',
    role: 'Talent',
    fromSuggested: 'Belenkov German',
    to: 'German Belenkov',
  },
  {
    department: 'stills',
    role: 'Photographer',
    fromSuggested: 'Hoài Lộc (ccreal studio)',
    to: 'Hoài Lộc',
  },
  {
    department: 'post',
    role: 'VFX',
    fromSuggested: 'Love Tech & Magic Studio',
    to: 'Love Tech & Magic',
  },
];

const SKIP_MERGES: { department: string; role: string; suggestedCanonical: string }[] =
  [
    {
      department: 'production',
      role: 'Agency',
      suggestedCanonical: 'T&A Ogilvy',
    },
  ];

function buildPositionKey(
  department: string,
  role: string,
  roleKey?: string,
): string {
  const dept = department.trim() || 'unknown';
  const roleId = roleKey?.trim() || normalizeCreditToken(role) || 'unknown';
  return `${dept}|${roleId}`;
}

function loadAudit(): AuditReport {
  const filePath = path.join(
    PATHS.migrationData,
    'crew-name-variants-audit.json',
  );
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as AuditReport;
}

function buildMergeRules(report: AuditReport): MergeRule[] {
  const rules: MergeRule[] = [];

  for (const group of report.groups) {
    const skip = SKIP_MERGES.some(
      (s) =>
        s.department === group.position.department &&
        s.role === group.position.role &&
        s.suggestedCanonical === group.suggestedCanonical,
    );
    if (skip) continue;

    let canonical = group.suggestedCanonical;
    for (const override of CANONICAL_OVERRIDES) {
      if (
        override.department === group.position.department &&
        override.role === group.position.role &&
        override.fromSuggested === group.suggestedCanonical
      ) {
        canonical = override.to;
      }
    }

    const aliases = group.variants
      .map((v) => v.name)
      .filter((name) => name !== canonical);

    if (!aliases.length) continue;

    rules.push({
      department: group.position.department,
      role: group.position.role,
      roleKey: group.position.roleKey,
      positionLabel: group.positionLabel,
      canonical,
      aliases,
    });
  }

  return rules;
}

function creditMatchesRule(credit: CreditValue, rule: MergeRule): boolean {
  if ((credit.department ?? '') !== rule.department) return false;
  const creditKey = buildPositionKey(
    credit.department ?? '',
    credit.role ?? '',
    credit.roleKey,
  );
  const ruleKey = buildPositionKey(rule.department, rule.role, rule.roleKey);
  return creditKey === ruleKey;
}

function applyMergesToDoc(
  doc: PortfolioDoc,
  rules: MergeRule[],
): { next: CreditValue[]; changes: string[] } {
  const credits = structuredClone(doc.crewCredits ?? []);
  const changes: string[] = [];

  for (const credit of credits) {
    if (!credit.people?.length) continue;
    for (const person of credit.people) {
      const name = person.name?.trim();
      if (!name) continue;

      for (const rule of rules) {
        if (!creditMatchesRule(credit, rule)) continue;
        if (!rule.aliases.includes(name)) continue;
        person.name = rule.canonical;
        changes.push(
          `${rule.positionLabel}: "${name}" → "${rule.canonical}"`,
        );
        break;
      }
    }
  }

  return { next: credits, changes };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const report = loadAudit();
  const rules = buildMergeRules(report);

  console.log('=== Apply crew name merges (position-scoped) ===\n');
  console.log(`Merge rules loaded: ${rules.length}`);
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log('Overrides:');
  for (const o of CANONICAL_OVERRIDES) {
    console.log(`  ${o.department} / ${o.role}: keep "${o.to}"`);
  }
  console.log('Skipped:');
  for (const s of SKIP_MERGES) {
    console.log(`  ${s.department} / ${s.role}: ${s.suggestedCanonical}`);
  }
  console.log('');

  const client = getWriteClient();
  const docs = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry" && defined(crewCredits) && count(crewCredits) > 0]{
      _id,
      title,
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
    const { next, changes } = applyMergesToDoc(doc, rules);
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
