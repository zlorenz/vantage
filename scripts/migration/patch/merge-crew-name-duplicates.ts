/**
 * Merge misspelled duplicate crew names into canonical forms.
 *
 * - Mate Toth Widamon → Tóth Widamon Máté
 * - Woodie / Pongchaiphat Sethanand → Woodie Pongchaiphat Sethanand
 * - Ngô Minh Nghĩa → Cối Ngô Minh Nghĩa
 * - Thai Anh Duong → Tút Thai-Anh Duong
 * - Tuyen Tran → Tuyển Trần (credit strings only; no crewMember taxonomy)
 * - Microwave Soup → Microwave Soups
 *
 * Rewrites portfolio crewMembers refs, credit strings, ensures canonical
 * crewMember docs, then deletes alias docs.
 *
 * Usage: npx tsx scripts/migration/patch/merge-crew-name-duplicates.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import { CREDITS_CONFIG } from '../lib/credits-config';
import { getWriteClient } from '../lib/sanity-client';
import '../config';

interface CrewMerge {
  /** Canonical crewMember doc id; omit for credit-string-only renames. */
  canonicalId?: string;
  canonicalName: string;
  aliasIds: string[];
  /** Exact string replacements for credit fields (apply in order). */
  creditReplacements: { from: string; to: string }[];
}

const MERGES: CrewMerge[] = [
  {
    canonicalId: 'crew-dop-toth-widamon-mate',
    canonicalName: 'Tóth Widamon Máté',
    aliasIds: ['crew-dop-mate-toth-widamon'],
    creditReplacements: [
      { from: 'Mate Toth Widamon', to: 'Tóth Widamon Máté' },
    ],
  },
  {
    canonicalId: 'crew-dop-woodie-pongchaiphat-sethanand',
    canonicalName: 'Woodie Pongchaiphat Sethanand',
    aliasIds: [
      'crew-dop-woodie',
      'crew-dop-pongchaiphat-sethanand',
    ],
    creditReplacements: [
      // Expand short forms only when not already prefixed with Woodie
      {
        from: 'Pongchaiphat Sethanand',
        to: 'Woodie Pongchaiphat Sethanand',
      },
      { from: 'Woodie', to: 'Woodie Pongchaiphat Sethanand' },
    ],
  },
  {
    canonicalId: 'crew-dop-coi-ngo-minh-nghia',
    canonicalName: 'Cối Ngô Minh Nghĩa',
    aliasIds: ['crew-dop-ngo-minh-nghia'],
    creditReplacements: [
      { from: 'Ngô Minh Nghĩa', to: 'Cối Ngô Minh Nghĩa' },
    ],
  },
  {
    canonicalId: 'crew-dop-tut-thai-anh-duong',
    canonicalName: 'Tút Thai-Anh Duong',
    aliasIds: ['crew-dop-thai-anh-duong'],
    creditReplacements: [
      { from: 'Thai Anh Duong', to: 'Tút Thai-Anh Duong' },
      { from: 'Thai-Anh Duong', to: 'Tút Thai-Anh Duong' },
    ],
  },
  {
    // Appears across post_editor, assistant editor, supervisor, BTS, etc.
    canonicalName: 'Tuyển Trần',
    aliasIds: [],
    creditReplacements: [{ from: 'Tuyen Tran', to: 'Tuyển Trần' }],
  },
  {
    canonicalId: 'crew-art-director-microwave-soup',
    canonicalName: 'Microwave Soups',
    aliasIds: [],
    creditReplacements: [
      // Singular → plural; guarded so "Microwave Soups" is not double-suffixed
      { from: 'Microwave Soup', to: 'Microwave Soups' },
    ],
  },
];

interface CrewRef {
  _key?: string;
  _type?: string;
  _ref: string;
}

interface PortfolioDoc {
  _id: string;
  title: string;
  slug: string;
  crewMembers?: CrewRef[];
  credits?: Record<string, Record<string, unknown>>;
}

function replaceCreditName(
  value: string,
  from: string,
  to: string,
): { value: string; changed: boolean } {
  if (!value.includes(from)) {
    return { value, changed: false };
  }

  // Avoid doubling "Woodie Woodie Pongchaiphat…" when expanding "Woodie"
  // or when expanding "Pongchaiphat Sethanand" already under Woodie.
  if (from === 'Woodie') {
    // Match standalone "Woodie" (whole token), not the start of the full name.
    const next = value.replace(
      /(^|[,;/]|\s)Woodie(?=(?:\s*[,;/]|$))/g,
      `$1${to}`,
    );
    return { value: next, changed: next !== value };
  }

  if (from === 'Pongchaiphat Sethanand') {
    const next = value.replace(
      /(?<!Woodie )Pongchaiphat Sethanand/g,
      to,
    );
    return { value: next, changed: next !== value };
  }

  if (from === 'Ngô Minh Nghĩa') {
    const next = value.replace(/(?<!Cối )Ngô Minh Nghĩa/g, to);
    return { value: next, changed: next !== value };
  }

  if (from === 'Thai Anh Duong' || from === 'Thai-Anh Duong') {
    // Don't rewrite when already inside "Tút Thai-Anh Duong"
    const next = value.replace(
      new RegExp(`(?<!Tút )${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
      to,
    );
    return { value: next, changed: next !== value };
  }

  if (from === 'Microwave Soup') {
    // Avoid "Microwave Soupss" when already plural
    const next = value.replace(/\bMicrowave Soup\b(?!s)/g, to);
    return { value: next, changed: next !== value };
  }

  const next = value.replaceAll(from, to);
  return { value: next, changed: next !== value };
}

function rewriteCredits(
  credits: Record<string, Record<string, unknown>>,
  replacements: { from: string; to: string }[],
): { credits: Record<string, Record<string, unknown>>; paths: string[] } {
  const next = structuredClone(credits);
  const paths: string[] = [];

  for (const [dept, config] of Object.entries(CREDITS_CONFIG)) {
    const deptData = next[dept];
    if (!deptData) continue;

    for (const field of config.fields) {
      const raw = deptData[field];
      if (typeof raw !== 'string') continue;
      let value = raw;
      let changed = false;
      for (const { from, to } of replacements) {
        const result = replaceCreditName(value, from, to);
        if (result.changed) {
          value = result.value;
          changed = true;
        }
      }
      if (changed) {
        deptData[field] = value;
        paths.push(`credits.${dept}.${field}: "${raw}" → "${value}"`);
      }
    }

    const additional = deptData.additional;
    if (!Array.isArray(additional)) continue;

    for (let i = 0; i < additional.length; i++) {
      const row = additional[i] as { role?: string; names?: string };
      for (const key of ['names', 'role'] as const) {
        const raw = row[key];
        if (typeof raw !== 'string') continue;
        let value = raw;
        let changed = false;
        for (const { from, to } of replacements) {
          const result = replaceCreditName(value, from, to);
          if (result.changed) {
            value = result.value;
            changed = true;
          }
        }
        if (changed) {
          row[key] = value;
          paths.push(
            `credits.${dept}.additional[${i}].${key}: "${raw}" → "${value}"`,
          );
        }
      }
    }
  }

  return { credits: next, paths };
}

function rewriteCrewMembers(
  refs: CrewRef[] | undefined,
  aliasToCanonical: Map<string, string>,
): { refs: CrewRef[]; changed: boolean; notes: string[] } {
  if (!refs?.length) {
    return { refs: refs ?? [], changed: false, notes: [] };
  }

  const notes: string[] = [];
  const seen = new Set<string>();
  const next: CrewRef[] = [];
  let changed = false;

  for (const ref of refs) {
    const mapped = aliasToCanonical.get(ref._ref) ?? ref._ref;
    if (mapped !== ref._ref) {
      changed = true;
      notes.push(`${ref._ref} → ${mapped}`);
    }
    if (seen.has(mapped)) {
      changed = true;
      notes.push(`dedupe ${mapped}`);
      continue;
    }
    seen.add(mapped);
    next.push({
      _type: 'reference',
      _ref: mapped,
      _key: ref._key || Math.random().toString(36).slice(2, 14),
    });
  }

  return { refs: next, changed, notes };
}

async function ensureCanonical(
  client: ReturnType<typeof getWriteClient>,
  merge: CrewMerge,
): Promise<void> {
  if (!merge.canonicalId) {
    console.log(
      `  skip (credit-only) → ${merge.canonicalName}`,
    );
    return;
  }

  const canonicalId = merge.canonicalId;
  const existing = await client.fetch<{ _id: string; name?: string } | null>(
    `*[_id == $id][0]{ _id, name }`,
    { id: canonicalId },
  );

  if (!existing) {
    const parsed = canonicalId.match(
      /^crew-(director|dop|art-director)-(.+)$/,
    );
    const role = parsed?.[1] ?? 'dop';
    const slug = parsed?.[2] ?? canonicalId.replace(/^crew-dop-/, '');
    await client.createOrReplace({
      _id: canonicalId,
      _type: 'crewMember',
      name: merge.canonicalName,
      role,
      slug: { _type: 'slug', current: slug },
    });
    console.log(`  created ${canonicalId} (${merge.canonicalName})`);
    return;
  }

  if (existing.name !== merge.canonicalName) {
    await client
      .patch(canonicalId)
      .set({ name: merge.canonicalName })
      .commit();
    console.log(
      `  renamed ${canonicalId}: "${existing.name}" → "${merge.canonicalName}"`,
    );
  } else {
    console.log(`  ok ${canonicalId} (${merge.canonicalName})`);
  }
}

async function main() {
  const client = getWriteClient();

  const aliasToCanonical = new Map<string, string>();
  const allReplacements: { from: string; to: string }[] = [];
  const allAliasIds: string[] = [];

  for (const merge of MERGES) {
    if (merge.canonicalId) {
      for (const aliasId of merge.aliasIds) {
        aliasToCanonical.set(aliasId, merge.canonicalId);
        allAliasIds.push(aliasId);
      }
    }
    allReplacements.push(...merge.creditReplacements);
  }

  console.log('=== Ensure canonical crew docs ===');
  for (const merge of MERGES) {
    await ensureCanonical(client, merge);
  }

  const portfolios = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry"]{
      _id,
      title,
      "slug": slug.current,
      crewMembers,
      credits
    }
  `);

  console.log(`\n=== Scan ${portfolios.length} portfolio entries ===\n`);

  let refsUpdated = 0;
  let creditsUpdated = 0;

  for (const doc of portfolios) {
    const patch: Record<string, unknown> = {};
    const notes: string[] = [];

    const crewResult = rewriteCrewMembers(doc.crewMembers, aliasToCanonical);
    if (crewResult.changed) {
      patch.crewMembers = crewResult.refs;
      notes.push(...crewResult.notes.map((n) => `crewMembers: ${n}`));
      refsUpdated++;
    }

    if (doc.credits) {
      const creditResult = rewriteCredits(doc.credits, allReplacements);
      if (creditResult.paths.length) {
        patch.credits = creditResult.credits;
        notes.push(...creditResult.paths);
        creditsUpdated++;
      }
    }

    if (!Object.keys(patch).length) continue;

    await client.patch(doc._id).set(patch).commit();
    console.log(`✓ ${doc.slug}`);
    for (const note of notes) {
      console.log(`    ${note}`);
    }
  }

  console.log('\n=== Delete alias crew docs ===');
  for (const aliasId of allAliasIds) {
    const exists = await client.fetch<string | null>(
      `*[_id == $id][0]._id`,
      { id: aliasId },
    );
    if (!exists) {
      console.log(`  skip missing ${aliasId}`);
      continue;
    }
    // Refuse delete if any refs remain
    const remaining = await client.fetch<number>(
      `count(*[_type == "portfolioEntry" && references($id)])`,
      { id: aliasId },
    );
    if (remaining > 0) {
      console.warn(
        `  KEEP ${aliasId} — still referenced by ${remaining} portfolio entries`,
      );
      continue;
    }
    await client.delete(aliasId);
    console.log(`  deleted ${aliasId}`);
  }

  // Blog body plain-text mentions (Portable Text leaf strings)
  console.log('\n=== Blog posts mentioning alias names ===');
  const blogHits = await client.fetch<
    { _id: string; title: string; slug: string }[]
  >(`
    *[_type == "blogPost" && (
      pt::text(body) match "*Mate Toth Widamon*" ||
      pt::text(bodyZh) match "*Mate Toth Widamon*" ||
      pt::text(body) match "*Pongchaiphat Sethanand*" ||
      pt::text(bodyZh) match "*Pongchaiphat Sethanand*"
    )]{ _id, title, "slug": slug.current }
  `);

  if (!blogHits.length) {
    console.log('  none found (or no pt::text matches)');
  } else {
    for (const post of blogHits) {
      console.log(
        `  NOTE: ${post.slug} still mentions an alias name in body — review manually (${post._id})`,
      );
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Portfolio ref rewrites: ${refsUpdated}`);
  console.log(`Portfolio credit rewrites: ${creditsUpdated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
