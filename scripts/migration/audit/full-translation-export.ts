/**
 * One-off read-only export of TranslatePress dictionary + gettext corpora.
 * Writes: migration-data/wp-translation-audit/full-translation-export.json
 * Does not write to WordPress or Sanity.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../config';
import { closePool, query, table } from '../db';

type DictRow = {
  id: number;
  original: string;
  translated: string;
  status: number;
  original_id: number;
};

type MetaRow = {
  original_id: number;
  post_id: number;
  post_type: string | null;
};

type GettextRow = {
  id: number;
  original: string;
  translated: string;
  status: number;
  domain: string | null;
};

type Flagged = {
  original: string;
  reason: string;
  pipeline: 'dictionary' | 'gettext';
};

/** Returns a reason string if the original should be excluded as noise, else null. */
function noiseReason(original: string): string | null {
  const trimmed = original.trim();
  if (!trimmed) return 'empty or whitespace';
  // Allow single-character strings (e.g. weekday abbreviations S/M/T/W/F).
  // Still exclude empty after trim via the check above.
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/wp-content/')) {
    return 'bare URL';
  }
  if (/^data:[^,\s]*;base64,/i.test(trimmed)) {
    return 'looks like base64';
  }
  // Very long single unbroken token of base64-ish charset (no spaces)
  if (
    !/\s/.test(trimmed) &&
    trimmed.length >= 120 &&
    /^[A-Za-z0-9+/_=-]+$/.test(trimmed)
  ) {
    return 'looks like base64';
  }
  return null;
}

async function main() {
  const dictTable = table('trp_dictionary_en_us_zh_cn');
  const metaTable = table('trp_original_meta');
  const postsTable = table('posts');
  const gettextTable = table('trp_gettext_zh_cn');

  const dictRows = await query<DictRow[]>(
    `SELECT id, original, translated, status, original_id
     FROM ${dictTable}
     WHERE status IN (1, 2)
       AND translated IS NOT NULL
       AND translated != ''`
  );

  const metaRows = await query<MetaRow[]>(
    `SELECT om.original_id AS original_id,
            CAST(om.meta_value AS UNSIGNED) AS post_id,
            p.post_type AS post_type
     FROM ${metaTable} om
     LEFT JOIN ${postsTable} p ON p.ID = CAST(om.meta_value AS UNSIGNED)
     WHERE om.meta_key = 'post_parent_id'`
  );

  const postsByOriginal = new Map<
    number,
    { ids: number[]; types: Set<string> }
  >();
  for (const row of metaRows) {
    if (!row.post_id) continue;
    let entry = postsByOriginal.get(row.original_id);
    if (!entry) {
      entry = { ids: [], types: new Set() };
      postsByOriginal.set(row.original_id, entry);
    }
    if (!entry.ids.includes(row.post_id)) {
      entry.ids.push(row.post_id);
    }
    if (row.post_type) entry.types.add(row.post_type);
  }

  const dictionary_entries: Array<{
    original: string;
    translated: string;
    status: number;
    linked_post_ids: number[];
    linked_post_types: string[];
  }> = [];
  const flagged_for_review: Flagged[] = [];

  for (const row of dictRows) {
    const reason = noiseReason(row.original ?? '');
    if (reason) {
      flagged_for_review.push({
        original: row.original ?? '',
        reason,
        pipeline: 'dictionary',
      });
      continue;
    }
    const linked = postsByOriginal.get(row.original_id);
    dictionary_entries.push({
      original: row.original,
      translated: row.translated,
      status: row.status,
      linked_post_ids: linked ? [...linked.ids].sort((a, b) => a - b) : [],
      linked_post_types: linked ? [...linked.types].sort() : [],
    });
  }

  const gettextRows = await query<GettextRow[]>(
    `SELECT id, original, translated, status, domain
     FROM ${gettextTable}
     WHERE status IN (1, 2)
       AND translated IS NOT NULL
       AND translated != ''`
  );

  const gettext_entries: Array<{
    original: string;
    translated: string;
    status: number;
    domain: string;
  }> = [];

  for (const row of gettextRows) {
    const reason = noiseReason(row.original ?? '');
    if (reason) {
      flagged_for_review.push({
        original: row.original ?? '',
        reason,
        pipeline: 'gettext',
      });
      continue;
    }
    gettext_entries.push({
      original: row.original,
      translated: row.translated,
      status: row.status,
      domain: row.domain ?? '',
    });
  }

  const dictionary_flagged = flagged_for_review.filter(
    (f) => f.pipeline === 'dictionary'
  ).length;
  const gettext_flagged = flagged_for_review.filter(
    (f) => f.pipeline === 'gettext'
  ).length;

  const output = {
    extracted_at: new Date().toISOString(),
    source: 'vantage_local (MAMP)',
    dictionary_entries,
    gettext_entries,
    flagged_for_review: flagged_for_review.map(({ original, reason }) => ({
      original,
      reason,
    })),
    counts: {
      dictionary_included: dictionary_entries.length,
      dictionary_flagged,
      gettext_included: gettext_entries.length,
      gettext_flagged,
    },
  };

  const outDir = path.join(PATHS.migrationData, 'wp-translation-audit');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'full-translation-export.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  // Chat report helpers
  const domainCounts = new Map<string, number>();
  for (const e of gettext_entries) {
    domainCounts.set(e.domain, (domainCounts.get(e.domain) ?? 0) + 1);
  }
  const domainBreakdown = [...domainCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  );

  const flaggedSample = flagged_for_review.slice(0, 10).map((f) => ({
    reason: f.reason,
    pipeline: f.pipeline,
    original_preview:
      f.original.length > 100 ? `${f.original.slice(0, 100)}…` : f.original,
  }));

  const stat = fs.statSync(outPath);
  console.log(
    JSON.stringify(
      {
        counts: output.counts,
        gettext_by_domain: Object.fromEntries(domainBreakdown),
        flagged_sample: flaggedSample,
        output_path: outPath,
        file_size_bytes: stat.size,
        total_rows:
          dictionary_entries.length +
          gettext_entries.length +
          flagged_for_review.length,
      },
      null,
      2
    )
  );

  await closePool();
}

main().catch(async (err) => {
  console.error(err);
  await closePool();
  process.exit(1);
});
