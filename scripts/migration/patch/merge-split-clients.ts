/**
 * Merge / rename / split client (brand) taxonomy entries.
 *
 * Merges:
 * - ASMOKE Grills → ASMOKE
 * - BRINC Drones → BRINC
 * - Huawei/HONOR → Huawei
 * - Toyota Vietnam → Toyota
 * - Hyundai Motor Company → Hyundai
 * - Samsung Vietnam → Samsung
 * - The Coca-Cola Company → Coca-Cola
 * - Tập đoàn Hòa Phát → Hòa Phát
 *
 * Renames:
 * - Procter & Gamble → P&G (keeps client-procter-gamble id/slug)
 *
 * Splits (portfolio gets BOTH targets):
 * - Comfort / Unilever → Comfort + Unilever
 * - Old Spice / P&G → Old Spice + P&G
 *
 * Usage: npx tsx scripts/migration/patch/merge-split-clients.ts
 *
 * Requires SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN in .env.local.
 */

import { CREDITS_CONFIG } from '../lib/credits-config';
import { getWriteClient } from '../lib/sanity-client';
import '../config';

interface ClientRef {
  _key?: string;
  _type?: string;
  _ref: string;
}

interface ClientMerge {
  canonicalId: string;
  canonicalName: string;
  aliasIds: string[];
}

interface ClientSplit {
  aliasId: string;
  targetIds: string[];
  /** Ensure these client docs exist with these names. */
  ensure: { id: string; name: string; slug: string }[];
}

interface PortfolioDoc {
  _id: string;
  title: string;
  slug: string;
  clients?: ClientRef[];
  credits?: Record<string, Record<string, unknown>>;
}

const MERGES: ClientMerge[] = [
  {
    canonicalId: 'client-asmoke',
    canonicalName: 'ASMOKE',
    aliasIds: ['client-asmoke-grills'],
  },
  {
    canonicalId: 'client-brinc',
    canonicalName: 'BRINC',
    aliasIds: ['client-brinc-drones'],
  },
  {
    canonicalId: 'client-huawei',
    canonicalName: 'Huawei',
    aliasIds: ['client-huawei-honor'],
  },
  {
    canonicalId: 'client-toyota',
    canonicalName: 'Toyota',
    aliasIds: ['client-toyota-vietnam'],
  },
  {
    canonicalId: 'client-hyundai',
    canonicalName: 'Hyundai',
    aliasIds: ['client-hyundai-motor-company'],
  },
  {
    canonicalId: 'client-samsung',
    canonicalName: 'Samsung',
    aliasIds: ['client-samsung-vietnam'],
  },
  {
    canonicalId: 'client-coca-cola',
    canonicalName: 'Coca-Cola',
    aliasIds: ['client-the-coca-cola-company'],
  },
  {
    canonicalId: 'client-hoa-phat',
    canonicalName: 'Hòa Phát',
    aliasIds: ['client-tap-doan-hoa-phat'],
  },
];

const RENAMES: { id: string; name: string }[] = [
  { id: 'client-procter-gamble', name: 'P&G' },
];

const SPLITS: ClientSplit[] = [
  {
    aliasId: 'client-comfort-unilever',
    targetIds: ['client-comfort', 'client-unilever'],
    ensure: [
      { id: 'client-comfort', name: 'Comfort', slug: 'comfort' },
      { id: 'client-unilever', name: 'Unilever', slug: 'unilever' },
    ],
  },
  {
    aliasId: 'client-old-spice-pg',
    targetIds: ['client-old-spice', 'client-procter-gamble'],
    ensure: [
      { id: 'client-old-spice', name: 'Old Spice', slug: 'old-spice' },
      { id: 'client-procter-gamble', name: 'P&G', slug: 'procter-gamble' },
    ],
  },
];

/** Credit / HTML brand string fixes (defensive; apply carefully). */
const CREDIT_REPLACEMENTS: { from: string; to: string }[] = [
  { from: 'ASMOKE Grills', to: 'ASMOKE' },
  { from: 'BRINC Drones', to: 'BRINC' },
  { from: 'Huawei/HONOR', to: 'Huawei' },
  { from: 'Huawei/Honor', to: 'Huawei' },
  { from: 'Toyota Vietnam', to: 'Toyota' },
  { from: 'Procter &amp; Gamble', to: 'P&amp;G' },
  { from: 'Procter & Gamble', to: 'P&G' },
  { from: 'Comfort / Unilever', to: 'Comfort, Unilever' },
  { from: 'Old Spice / P&G', to: 'Old Spice, P&G' },
  { from: 'Old Spice / P&amp;G', to: 'Old Spice, P&amp;G' },
  { from: 'Hyundai Motor Company', to: 'Hyundai' },
  { from: 'Samsung Vietnam', to: 'Samsung' },
  { from: 'The Coca-Cola Company', to: 'Coca-Cola' },
  { from: 'Tập đoàn Hòa Phát', to: 'Hòa Phát' },
];

function newKey(): string {
  return Math.random().toString(36).slice(2, 14);
}

async function ensureClient(
  client: ReturnType<typeof getWriteClient>,
  id: string,
  name: string,
  slug: string,
): Promise<void> {
  const existing = await client.fetch<{ _id: string; name?: string } | null>(
    `*[_id == $id][0]{ _id, name }`,
    { id },
  );
  if (!existing) {
    await client.createOrReplace({
      _id: id,
      _type: 'client',
      name,
      slug: { _type: 'slug', current: slug },
    });
    console.log(`  created ${id} (${name})`);
    return;
  }
  if (existing.name !== name) {
    await client.patch(id).set({ name }).commit();
    console.log(`  renamed ${id}: "${existing.name}" → "${name}"`);
  } else {
    console.log(`  ok ${id} (${name})`);
  }
}

function rewriteClientRefs(
  refs: ClientRef[] | undefined,
  aliasMap: Map<string, string[]>,
): { refs: ClientRef[]; changed: boolean; notes: string[] } {
  if (!refs?.length) {
    return { refs: refs ?? [], changed: false, notes: [] };
  }

  const notes: string[] = [];
  const seen = new Set<string>();
  const next: ClientRef[] = [];
  let changed = false;

  for (const ref of refs) {
    const targets = aliasMap.get(ref._ref) ?? [ref._ref];
    if (targets.length !== 1 || targets[0] !== ref._ref) {
      changed = true;
      notes.push(`${ref._ref} → [${targets.join(', ')}]`);
    }
    for (const target of targets) {
      if (seen.has(target)) {
        changed = true;
        notes.push(`dedupe ${target}`);
        continue;
      }
      seen.add(target);
      next.push({
        _type: 'reference',
        _ref: target,
        _key: ref._key && targets.length === 1 ? ref._key : newKey(),
      });
    }
  }

  return { refs: next, changed, notes };
}

function rewriteCredits(
  credits: Record<string, Record<string, unknown>>,
  replacements: { from: string; to: string }[],
): { credits: Record<string, Record<string, unknown>>; paths: string[] } {
  const next = structuredClone(credits);
  const paths: string[] = [];

  const apply = (raw: string): { value: string; changed: boolean } => {
    let value = raw;
    let changed = false;
    for (const { from, to } of replacements) {
      if (!value.includes(from)) continue;
      const updated = value.replaceAll(from, to);
      if (updated !== value) {
        value = updated;
        changed = true;
      }
    }
    return { value, changed };
  };

  for (const [dept, config] of Object.entries(CREDITS_CONFIG)) {
    const deptData = next[dept];
    if (!deptData) continue;

    for (const field of config.fields) {
      const raw = deptData[field];
      if (typeof raw !== 'string') continue;
      const result = apply(raw);
      if (result.changed) {
        deptData[field] = result.value;
        paths.push(`credits.${dept}.${field}`);
      }
    }

    const additional = deptData.additional;
    if (!Array.isArray(additional)) continue;
    for (let i = 0; i < additional.length; i++) {
      const row = additional[i] as { role?: string; names?: string };
      for (const key of ['names', 'role'] as const) {
        const raw = row[key];
        if (typeof raw !== 'string') continue;
        const result = apply(raw);
        if (result.changed) {
          row[key] = result.value;
          paths.push(`credits.${dept}.additional[${i}].${key}`);
        }
      }
    }
  }

  return { credits: next, paths };
}

async function main() {
  const client = getWriteClient();

  // aliasId → replacement target id(s)
  const aliasMap = new Map<string, string[]>();

  console.log('=== Ensure merge canonicals ===');
  for (const merge of MERGES) {
    const slug = merge.canonicalId.replace(/^client-/, '');
    await ensureClient(client, merge.canonicalId, merge.canonicalName, slug);
    for (const aliasId of merge.aliasIds) {
      aliasMap.set(aliasId, [merge.canonicalId]);
    }
  }

  console.log('\n=== Renames ===');
  for (const rename of RENAMES) {
    const slug = rename.id.replace(/^client-/, '');
    await ensureClient(client, rename.id, rename.name, slug);
  }

  console.log('\n=== Ensure split targets ===');
  for (const split of SPLITS) {
    for (const target of split.ensure) {
      await ensureClient(client, target.id, target.name, target.slug);
    }
    aliasMap.set(split.aliasId, split.targetIds);
  }

  const allAliasIds = [
    ...MERGES.flatMap((m) => m.aliasIds),
    ...SPLITS.map((s) => s.aliasId),
  ];

  const portfolios = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry"]{
      _id,
      title,
      "slug": slug.current,
      clients,
      credits
    }
  `);

  console.log(`\n=== Scan ${portfolios.length} portfolio entries ===\n`);

  let refsUpdated = 0;
  let creditsUpdated = 0;

  for (const doc of portfolios) {
    const patch: Record<string, unknown> = {};
    const notes: string[] = [];

    const refResult = rewriteClientRefs(doc.clients, aliasMap);
    if (refResult.changed) {
      patch.clients = refResult.refs;
      notes.push(...refResult.notes.map((n) => `clients: ${n}`));
      refsUpdated++;
    }

    if (doc.credits) {
      const creditResult = rewriteCredits(doc.credits, CREDIT_REPLACEMENTS);
      if (creditResult.paths.length) {
        patch.credits = creditResult.credits;
        notes.push(...creditResult.paths.map((p) => `credit: ${p}`));
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

  console.log('\n=== Delete alias / combined client docs ===');
  for (const aliasId of allAliasIds) {
    const exists = await client.fetch<string | null>(
      `*[_id == $id][0]._id`,
      { id: aliasId },
    );
    if (!exists) {
      console.log(`  skip missing ${aliasId}`);
      continue;
    }
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

  console.log('\n--- Summary ---');
  console.log(`Portfolio client-ref rewrites: ${refsUpdated}`);
  console.log(`Portfolio credit rewrites: ${creditsUpdated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
