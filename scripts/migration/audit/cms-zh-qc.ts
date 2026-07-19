/**
 * Fast sitewide CMS ZH QC — pages, blog, taxonomies (portfolio has its own audit).
 *
 * Usage: npm run migrate:audit:cms-zh
 * Output: migration-data/cms-zh-qc.json
 */

import path from 'node:path';
import { PATHS } from '../config';
import { writeJson } from '../lib/fs';
import { getWriteClient } from '../lib/sanity-client';

type Severity = 'error' | 'warn' | 'info';

interface Finding {
  severity: Severity;
  type: string;
  id: string;
  field: string;
  code: string;
  message: string;
  preview?: string;
}

function plain(s: string | undefined | null): string {
  return String(s ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/** Known bad TRP slug fragments */
const BAD_SLUG_RE = /^(按|有创意|车载|电子学|突变|爱泉)$/;

async function main() {
  console.log('CMS ZH QC audit (pages / blog / taxonomies)\n');
  const client = getWriteClient();
  const findings: Finding[] = [];

  const pages = await client.fetch<
    Array<{
      _id: string;
      slug: string;
      title?: string;
      titleZh?: string;
      heroTitle?: string;
      heroTitleZh?: string;
      body?: unknown[];
      bodyZh?: unknown[];
    }>
  >(`*[_type=="page"]{
    _id, "slug": slug.current, title, titleZh, heroTitle, heroTitleZh,
    "body": body, "bodyZh": bodyZh
  }`);

  for (const p of pages) {
    if (plain(p.title) && !plain(p.titleZh)) {
      findings.push({
        severity: 'error',
        type: 'page',
        id: p.slug,
        field: 'titleZh',
        code: 'missing_zh',
        message: 'Missing titleZh',
        preview: plain(p.title),
      });
    }
    if (plain(p.heroTitle) && !plain(p.heroTitleZh)) {
      // contact / work-internal are low risk
      const sev: Severity =
        p.slug === 'contact' || p.slug === 'work-internal' ? 'info' : 'warn';
      findings.push({
        severity: sev,
        type: 'page',
        id: p.slug,
        field: 'heroTitleZh',
        code: 'missing_zh',
        message: 'Missing heroTitleZh',
        preview: plain(p.heroTitle),
      });
    }
    if ((p.body?.length ?? 0) > 0 && !(p.bodyZh?.length ?? 0)) {
      const sev: Severity =
        p.slug === 'video-campaign-brief' || p.slug === 'work-internal'
          ? 'info'
          : 'warn';
      findings.push({
        severity: sev,
        type: 'page',
        id: p.slug,
        field: 'bodyZh',
        code: 'missing_zh',
        message: 'Missing bodyZh',
      });
    }
  }

  const blogs = await client.fetch<
    Array<{
      _id: string;
      slug: string;
      slugZh?: string;
      title?: string;
      titleZh?: string;
      excerpt?: string;
      excerptZh?: string;
      body?: unknown[];
      bodyZh?: unknown[];
    }>
  >(`*[_type=="blogPost"]{
    _id, "slug": slug.current, "slugZh": slugZh.current,
    title, titleZh, excerpt, excerptZh, body, bodyZh
  }`);

  for (const b of blogs) {
    for (const [en, zh, field] of [
      [b.title, b.titleZh, 'titleZh'],
      [b.excerpt, b.excerptZh, 'excerptZh'],
    ] as const) {
      if (plain(en) && !plain(zh)) {
        findings.push({
          severity: 'error',
          type: 'blogPost',
          id: b.slug,
          field,
          code: 'missing_zh',
          message: `Missing ${field}`,
          preview: plain(en).slice(0, 80),
        });
      } else if (plain(zh) && !hasCjk(plain(zh)) && plain(zh).split(/\s+/).length >= 4) {
        findings.push({
          severity: 'warn',
          type: 'blogPost',
          id: b.slug,
          field,
          code: 'no_cjk',
          message: `${field} has no Chinese characters`,
          preview: plain(zh).slice(0, 80),
        });
      }
    }
    if ((b.body?.length ?? 0) > 0 && !(b.bodyZh?.length ?? 0)) {
      findings.push({
        severity: 'error',
        type: 'blogPost',
        id: b.slug,
        field: 'bodyZh',
        code: 'missing_zh',
        message: 'Missing bodyZh',
      });
    }
    if (!b.slugZh) {
      findings.push({
        severity: 'warn',
        type: 'blogPost',
        id: b.slug,
        field: 'slugZh',
        code: 'missing_slug_zh',
        message: 'Missing slugZh (falls back to EN)',
      });
    } else if (BAD_SLUG_RE.test(b.slugZh) || /avantage|阮仲/.test(b.slugZh)) {
      findings.push({
        severity: 'warn',
        type: 'blogPost',
        id: b.slug,
        field: 'slugZh',
        code: 'bad_slug_zh',
        message: 'Suspect slugZh quality',
        preview: b.slugZh,
      });
    }
  }

  const taxTypes = ['industry', 'market', 'videoFormat', 'category'] as const;
  for (const type of taxTypes) {
    const rows = await client.fetch<
      Array<{
        _id: string;
        slug: string;
        slugZh?: string;
        title?: string;
        titleZh?: string;
      }>
    >(
      `*[_type==$type]{_id, "slug": slug.current, "slugZh": slugZh.current, title, titleZh}`,
      { type },
    );
    for (const r of rows) {
      if (plain(r.title) && !plain(r.titleZh)) {
        findings.push({
          severity: 'error',
          type,
          id: r.slug,
          field: 'titleZh',
          code: 'missing_zh',
          message: 'Missing titleZh',
          preview: plain(r.title),
        });
      }
      if (!r.slugZh) {
        findings.push({
          severity: 'error',
          type,
          id: r.slug,
          field: 'slugZh',
          code: 'missing_slug_zh',
          message: 'Missing slugZh',
        });
      } else if (BAD_SLUG_RE.test(r.slugZh)) {
        findings.push({
          severity: 'error',
          type,
          id: r.slug,
          field: 'slugZh',
          code: 'bad_slug_zh',
          message: 'Bad TRP slugZh',
          preview: r.slugZh,
        });
      }
    }
  }

  const bySeverity = { error: 0, warn: 0, info: 0 };
  for (const f of findings) bySeverity[f.severity] += 1;

  const report = {
    generatedAt: new Date().toISOString(),
    findingCounts: bySeverity,
    findings: {
      error: findings.filter((f) => f.severity === 'error'),
      warn: findings.filter((f) => f.severity === 'warn'),
      info: findings.filter((f) => f.severity === 'info'),
    },
  };

  const outPath = path.join(PATHS.migrationData, 'cms-zh-qc.json');
  writeJson(outPath, report);

  console.log(
    `Findings: ${bySeverity.error} error, ${bySeverity.warn} warn, ${bySeverity.info} info`,
  );
  if (bySeverity.error) {
    console.log('\nErrors:');
    for (const f of report.findings.error) {
      console.log(`  [${f.type}] ${f.id} ${f.field}: ${f.message}${f.preview ? ` — ${f.preview}` : ''}`);
    }
  }
  if (bySeverity.warn) {
    console.log('\nWarns (sample):');
    for (const f of report.findings.warn.slice(0, 20)) {
      console.log(`  [${f.type}] ${f.id} ${f.field}: ${f.message}${f.preview ? ` — ${f.preview}` : ''}`);
    }
  }
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
