/**
 * Strip TranslatePress `。.` / `？.` / `！.` artifacts from Chinese fields in
 * migration JSON + Sanity documents.
 *
 *   npx tsx scripts/migration/patch/clean-trp-punctuation.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../config';
import { readJson, writeJson } from '../lib/fs';
import { getWriteClient, patchSet } from '../lib/sanity-client';
import { cleanTrpArtifacts } from '../lib/translation-text';

function cleanValue(value: unknown): { value: unknown; changed: boolean } {
  if (typeof value === 'string') {
    const cleaned = cleanTrpArtifacts(value);
    return { value: cleaned, changed: cleaned !== value };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = cleanValue(item);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: next, changed };
  }

  if (value && typeof value === 'object') {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const result = cleanValue(child);
      next[key] = result.value;
      if (result.changed) changed = true;
    }
    return { value: next, changed };
  }

  return { value, changed: false };
}

function cleanJsonFile(relativePath: string): number {
  const filePath = path.join(PATHS.migrationData, relativePath);
  if (!fs.existsSync(filePath)) return 0;
  const raw = fs.readFileSync(filePath, 'utf8');
  const cleaned = cleanTrpArtifacts(raw);
  if (cleaned === raw) return 0;
  const count = (raw.match(/([。！？])\./g) || []).length;
  fs.writeFileSync(filePath, cleaned);
  return count;
}

const ZH_DOC_FIELDS = [
  'titleZh',
  'heroTitleZh',
  'bodyZh',
  'excerptZh',
  'descriptionZh',
  'thumbTitleZh',
  'headerTitleZh',
  'longTitleZh',
  'founders',
  'seo',
] as const;

async function patchSanityDocs(): Promise<number> {
  const client = getWriteClient();
  const docs = await client.fetch<Array<Record<string, unknown> & { _id: string; _type: string }>>(
    `*[_type in ["page", "blogPost", "portfolioEntry"]]{
      _id,
      _type,
      titleZh,
      heroTitleZh,
      bodyZh,
      excerptZh,
      descriptionZh,
      thumbTitleZh,
      headerTitleZh,
      longTitleZh,
      founders,
      seo
    }`,
  );

  let patched = 0;
  for (const doc of docs) {
    const set: Record<string, unknown> = {};
    for (const field of ZH_DOC_FIELDS) {
      if (!(field in doc) || doc[field] == null) continue;
      const result = cleanValue(doc[field]);
      if (result.changed) set[field] = result.value;
    }
    if (!Object.keys(set).length) continue;
    await patchSet(doc._id, set);
    patched += 1;
    console.log(`Patched ${doc._type} ${doc._id}`);
  }
  return patched;
}

async function main() {
  const files = [
    'pages.json',
    'blog-posts.json',
    'portfolio.json',
    'blog-excerpts-zh.json',
    'translation-audit.json',
  ];

  for (const file of files) {
    const n = cleanJsonFile(file);
    if (n) console.log(`Cleaned ${n} artifacts in ${file}`);
  }

  // Re-serialize blog/pages JSON via parse to keep formatting consistent if needed
  for (const file of ['pages.json', 'blog-posts.json', 'portfolio.json'] as const) {
    const filePath = path.join(PATHS.migrationData, file);
    if (!fs.existsSync(filePath)) continue;
    const data = readJson<unknown>(filePath);
    writeJson(filePath, data);
  }

  const patched = await patchSanityDocs();
  console.log(`Done: ${patched} Sanity documents patched`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
