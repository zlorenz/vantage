/**
 * Portfolio Chinese QC audit — scans live Sanity docs for translation gaps
 * and known bad patterns so you don't have to open ~140 pages by hand.
 *
 * Usage: npm run migrate:audit:portfolio-zh
 * Output: migration-data/portfolio-zh-qc.json (+ console summary)
 *
 * Severity:
 *   error   — will render English/raw/Vietnamese on /zh pages
 *   warn    — likely wrong or incomplete ZH (review list)
 *   info    — brand-like identical titles; optional polish
 */

import path from 'node:path';
import { PATHS } from '../config';
import { writeJson } from '../lib/fs';
import { getWriteClient } from '../lib/sanity-client';
import { CREDIT_LABEL_ZH } from '../../../src/lib/credits-labels-zh';
import { CREDITS_CONFIG } from '../../../src/lib/credits-config';

type Severity = 'error' | 'warn' | 'info';

interface Finding {
  severity: Severity;
  slug: string;
  field: string;
  code: string;
  message: string;
  preview?: string;
}

interface PortfolioDoc {
  _id: string;
  title?: string;
  titleZh?: string;
  slug: string;
  thumbTitle?: string;
  thumbTitleZh?: string;
  headerTitle?: string;
  headerTitleZh?: string;
  longTitle?: string;
  longTitleZh?: string;
  description?: string;
  descriptionZh?: string;
  additionalVideos?: Array<{
    longTitle?: string;
    longTitleZh?: string;
    description?: string;
    descriptionZh?: string;
  }>;
  credits?: Record<string, Record<string, unknown>>;
}

const VIETNAMESE_RE =
  /[đĐơƠưƯạảãâầấậẩẫăằắặẳẵẹẻẽêềếệểễịỉĩọỏõôồốộổỗờớợởỡụủũừứựửữỳỵỷỹ]/;

const KNOWN_BAD_GLOSSES = [
  { re: /城规银行/, note: 'bad TRP gloss for TPBank App' },
];

/** Strip HTML for equality / Latin checks. */
function plain(html: string | undefined | null): string {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function hasLatinSentence(text: string): boolean {
  // Multiple English words (not just a brand acronym)
  const words = text.match(/[A-Za-z]{3,}/g) ?? [];
  return words.length >= 3;
}

function looksBrandOnly(text: string): boolean {
  const p = plain(text);
  if (!p) return true;
  if (hasCjk(p)) return false;
  const words = p.match(/[A-Za-z0-9+]+/g) ?? [];
  return words.length <= 4 && !/[.!?…]/.test(p);
}

function preview(text: string, max = 90): string {
  const one = plain(text);
  return one.length <= max ? one : `${one.slice(0, max)}…`;
}

function pushMissingZh(
  findings: Finding[],
  slug: string,
  field: string,
  en: string | undefined,
  zh: string | undefined,
  opts: { requireCjk?: boolean } = {},
) {
  const enPlain = plain(en);
  if (!enPlain) return;

  const zhPlain = plain(zh);
  if (!zhPlain) {
    findings.push({
      severity: 'error',
      slug,
      field,
      code: 'missing_zh',
      message: `Missing ${field} while English has content`,
      preview: preview(enPlain),
    });
    return;
  }

  if (zhPlain === enPlain) {
    const severity: Severity = looksBrandOnly(enPlain) ? 'info' : 'warn';
    findings.push({
      severity,
      slug,
      field,
      code: 'identical_en_zh',
      message:
        severity === 'info'
          ? `${field} matches EN (brand-like — often OK)`
          : `${field} identical to English (likely untranslated)`,
      preview: preview(enPlain),
    });
  } else if (opts.requireCjk !== false && hasLatinSentence(zhPlain) && !hasCjk(zhPlain)) {
    findings.push({
      severity: 'warn',
      slug,
      field,
      code: 'no_cjk',
      message: `${field} has no Chinese characters`,
      preview: preview(zhPlain),
    });
  }

  // Prefer unique Vietnamese letters to avoid Spanish names (Julián, etc.)
  if (VIETNAMESE_RE.test(zhPlain) || VIETNAMESE_RE.test(String(zh ?? ''))) {
    findings.push({
      severity: 'error',
      slug,
      field,
      code: 'vietnamese_leak',
      message: `${field} contains Vietnamese diacritics`,
      preview: preview(zh ?? zhPlain),
    });
  }

  // Only flag the locale value under review (ZH when present)
  if (field.includes('description') && /<\/?p\b/i.test(String(zh ?? ''))) {
    findings.push({
      severity: 'error',
      slug,
      field,
      code: 'raw_html',
      message: `${field} still contains raw <p> tags`,
      preview: preview(zh ?? ''),
    });
  }

  for (const bad of KNOWN_BAD_GLOSSES) {
    if (bad.re.test(zhPlain)) {
      findings.push({
        severity: 'error',
        slug,
        field,
        code: 'known_bad_gloss',
        message: `${field}: ${bad.note}`,
        preview: preview(zhPlain),
      });
    }
  }
}

function collectUnmappedCreditRoles(credits: PortfolioDoc['credits']): string[] {
  if (!credits) return [];
  const unmapped = new Set<string>();

  for (const dept of CREDITS_CONFIG) {
    const block = credits[dept.key];
    if (!block) continue;
    // Sanity stores `additional`; repeater slug is legacy WP ACF name
    const additional = block.additional ?? block[dept.repeater];
    if (!Array.isArray(additional)) continue;
    for (const row of additional) {
      const role = String((row as { role?: string }).role ?? '').trim();
      if (!role) continue;
      if (!(role in CREDIT_LABEL_ZH)) unmapped.add(role);
    }
  }
  return [...unmapped].sort();
}

function auditDoc(doc: PortfolioDoc): Finding[] {
  const findings: Finding[] = [];
  const slug = doc.slug;

  pushMissingZh(findings, slug, 'titleZh', doc.title, doc.titleZh);
  pushMissingZh(findings, slug, 'thumbTitleZh', doc.thumbTitle, doc.thumbTitleZh);
  pushMissingZh(findings, slug, 'headerTitleZh', doc.headerTitle, doc.headerTitleZh);
  pushMissingZh(findings, slug, 'longTitleZh', doc.longTitle, doc.longTitleZh);
  pushMissingZh(findings, slug, 'descriptionZh', doc.description, doc.descriptionZh);

  (doc.additionalVideos ?? []).forEach((video, i) => {
    const prefix = `additionalVideos[${i}]`;
    pushMissingZh(
      findings,
      slug,
      `${prefix}.longTitleZh`,
      video.longTitle,
      video.longTitleZh,
    );
    if (plain(video.description)) {
      pushMissingZh(
        findings,
        slug,
        `${prefix}.descriptionZh`,
        video.description,
        video.descriptionZh,
      );
    }
    // EN additional description with raw HTML (shows on EN too, but ZH page may fall back)
    if (/<\/?p\b/i.test(String(video.description ?? '')) && !plain(video.descriptionZh)) {
      findings.push({
        severity: 'error',
        slug,
        field: `${prefix}.description`,
        code: 'raw_html_fallback',
        message: 'Additional video EN description has raw HTML and no descriptionZh',
        preview: preview(video.description ?? ''),
      });
    }
  });

  for (const role of collectUnmappedCreditRoles(doc.credits)) {
    findings.push({
      severity: 'warn',
      slug,
      field: 'credits.additional',
      code: 'unmapped_credit_role',
      message: `Additional credit role has no ZH label: "${role}"`,
      preview: role,
    });
  }

  return findings;
}

function countBy<T extends string>(items: { severity: T }[]): Record<T, number> {
  const out = {} as Record<T, number>;
  for (const item of items) {
    out[item.severity] = (out[item.severity] ?? 0) + 1;
  }
  return out;
}

async function main() {
  console.log('Portfolio ZH QC audit — live Sanity\n');

  const client = getWriteClient();
  const docs = await client.fetch<PortfolioDoc[]>(`
    *[_type == "portfolioEntry"] | order(title asc) {
      _id,
      title,
      titleZh,
      "slug": slug.current,
      thumbTitle,
      thumbTitleZh,
      headerTitle,
      headerTitleZh,
      longTitle,
      longTitleZh,
      description,
      descriptionZh,
      additionalVideos[]{
        longTitle,
        longTitleZh,
        description,
        descriptionZh
      },
      credits
    }
  `);

  const findings: Finding[] = [];
  for (const doc of docs) {
    findings.push(...auditDoc(doc));
  }

  const bySeverity = countBy(findings);
  const errors = findings.filter((f) => f.severity === 'error');
  const warns = findings.filter((f) => f.severity === 'warn');
  const infos = findings.filter((f) => f.severity === 'info');

  const byCode: Record<string, number> = {};
  for (const f of findings) {
    byCode[f.code] = (byCode[f.code] ?? 0) + 1;
  }

  const errorSlugs = [...new Set(errors.map((f) => f.slug))].sort();
  const warnSlugs = [
    ...new Set(warns.map((f) => f.slug).filter((s) => !errorSlugs.includes(s))),
  ].sort();

  const unmappedRoles = [
    ...new Set(
      findings
        .filter((f) => f.code === 'unmapped_credit_role')
        .map((f) => f.preview)
        .filter(Boolean) as string[],
    ),
  ].sort();

  const report = {
    generatedAt: new Date().toISOString(),
    totalEntries: docs.length,
    findingCounts: bySeverity,
    byCode,
    errorSlugCount: errorSlugs.length,
    warnOnlySlugCount: warnSlugs.length,
    errorSlugs,
    warnOnlySlugs: warnSlugs,
    unmappedCreditRoles: unmappedRoles,
    findings: {
      error: errors,
      warn: warns,
      info: infos,
    },
  };

  const outPath = path.join(PATHS.migrationData, 'portfolio-zh-qc.json');
  writeJson(outPath, report);

  console.log(`Entries scanned: ${docs.length}`);
  console.log(
    `Findings: ${errors.length} error, ${warns.length} warn, ${infos.length} info`,
  );
  console.log(`Entries with errors: ${errorSlugs.length}`);
  console.log(`Entries with warns only: ${warnSlugs.length}`);
  console.log('\nBy code:');
  for (const [code, n] of Object.entries(byCode).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${code}: ${n}`);
  }

  if (unmappedRoles.length) {
    console.log('\nUnmapped additional credit roles (add to credits-labels-zh.ts):');
    for (const role of unmappedRoles) console.log(`  - ${role}`);
  }

  if (errorSlugs.length) {
    console.log('\nError slugs (review / patch first):');
    for (const s of errorSlugs.slice(0, 40)) console.log(`  ${s}`);
    if (errorSlugs.length > 40) console.log(`  … +${errorSlugs.length - 40} more`);
  }

  console.log(`\nWrote ${outPath}`);
  console.log(
    '\nTriage: fix errors → spot-check warn slugs → ignore brand-like info identicals.',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
