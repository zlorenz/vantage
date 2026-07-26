/**
 * Phase 1 translation audit — TranslatePress dictionary coverage vs migration export
 * and hardcoded UI strings in the Next.js app.
 *
 * Usage: npm run migrate:audit:translations
 * Output: migration-data/translation-audit.json (+ console summary)
 *
 * Requires WP local DB (.env.local) for dictionary queries. UI/slug sections run offline.
 */

import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../config';
import { closePool, query, table } from '../db';
import type { ExportedPage } from '../export/pages';
import type { ExportedPortfolio } from '../export/portfolio';
import { readJson, writeJson } from '../lib/fs';
import { PAGE_SLUG_ZH } from '../lib/slug-zh';
import {
  exactDictionaryLookup,
  extractHtmlTextSegments,
  htmlToPlainText,
  lookupInDictionary,
  normalizeWhitespace,
} from '../lib/translation-text';
import { loadDictionary } from '../lib/translatepress';
import { routing } from '../../../src/i18n/routing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FieldCoverage {
  total: number;
  exactHit: number;
  enhancedHit: number;
  miss: number;
  /** Items with enhanced hit but NOT exact (migration currently misses these). */
  recoverableByStrip: number;
}

interface FieldMiss {
  id: string;
  field: string;
  preview: string;
  enhancedTranslated?: string;
  matchedKey?: string;
}

interface SlugMismatch {
  pageSlug: string;
  source: string;
  slugZh: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Curated UI chrome strings (hardcoded in src/ — not from CMS)
// ---------------------------------------------------------------------------

const UI_CHROME_STRINGS: { id: string; text: string; location: string }[] = [
  { id: 'nav.home', text: 'Home', location: 'SiteHeader' },
  { id: 'nav.about', text: 'About', location: 'SiteHeader' },
  { id: 'nav.vietnam', text: 'Vietnam Production Service', location: 'SiteHeader dropdown' },
  { id: 'nav.work', text: 'Work', location: 'SiteHeader' },
  { id: 'nav.news', text: 'News', location: 'SiteHeader' },
  { id: 'nav.contact', text: 'Contact', location: 'SiteHeader' },
  { id: 'home.section.work', text: 'A BIT OF', location: 'page.tsx' },
  { id: 'home.section.work2', text: 'OUR WORK', location: 'page.tsx' },
  { id: 'home.cta.viewWork', text: 'VIEW ALL WORK', location: 'page.tsx' },
  { id: 'home.heading.global', text: 'GLOBAL COMMERCIAL FILM PRODUCTION', location: 'page.tsx' },
  { id: 'home.heading.for', text: 'FOR', location: 'page.tsx' },
  { id: 'home.heading.brands', text: 'AMBITIOUS BRANDS', location: 'page.tsx' },
  { id: 'home.cta.about', text: 'LEARN MORE ABOUT US', location: 'page.tsx' },
  { id: 'home.section.brands', text: 'BRANDS', location: 'page.tsx' },
  { id: 'home.section.brands2', text: 'WE WORK WITH', location: 'page.tsx' },
  { id: 'filter.videoFormat', text: 'Video Format', location: 'PortfolioGrid' },
  { id: 'filter.industry', text: 'Industry', location: 'PortfolioGrid' },
  { id: 'filter.market', text: 'Market', location: 'PortfolioGrid' },
  { id: 'filter.all', text: 'All', location: 'PortfolioGrid' },
  { id: 'filter.client', text: 'Client', location: 'PortfolioGrid (internal)' },
  { id: 'filter.director', text: 'Director', location: 'PortfolioGrid (internal)' },
  { id: 'filter.dop', text: 'DOP', location: 'PortfolioGrid (internal)' },
  { id: 'filter.artDirector', text: 'Art Director', location: 'PortfolioGrid (internal)' },
  { id: 'filter.empty', text: 'No portfolio items found.', location: 'PortfolioGrid' },
  { id: 'search.placeholder', text: 'Search', location: 'NavSearch' },
  { id: 'search.hint', text: 'Enter a search term above.', location: 'SearchPageClient' },
  { id: 'search.portfolio', text: 'PORTFOLIO', location: 'SearchPageClient' },
  { id: 'search.news', text: 'NEWS', location: 'SearchPageClient' },
  { id: 'about.team', text: 'OUR', location: 'about/page.tsx' },
  { id: 'about.team2', text: 'TEAM', location: 'about/page.tsx' },
  { id: 'cta.button', text: 'TELL US ABOUT YOUR CAMPAIGN', location: 'cta-content.ts' },
  { id: 'vietnam.shotIn', text: 'SHOT IN', location: 'vietnam-production-service/page.tsx' },
  { id: 'vietnam.vietnam', text: 'VIETNAM', location: 'vietnam-production-service/page.tsx' },
];

// Live-site nav labels (for reference when TRP has no dictionary entry)
const LIVE_SITE_NAV_ZH: Record<string, string> = {
  Home: '主页',
  About: '关于我们',
  Work: '作品',
  News: '新闻动态',
  Contact: '联系',
  'Vietnam Production Service': '越南制作服务',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function preview(text: string, max = 80): string {
  const oneLine = normalizeWhitespace(text);
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}…`;
}

async function measureField(
  dict: Map<string, string>,
  items: { id: string; value: string | undefined }[],
  fieldName: string,
  maxMisses = 25,
): Promise<{ coverage: FieldCoverage; misses: FieldMiss[]; recoverable: FieldMiss[] }> {
  let exactHit = 0;
  let enhancedHit = 0;
  let recoverableByStrip = 0;
  const misses: FieldMiss[] = [];
  const recoverable: FieldMiss[] = [];

  for (const { id, value } of items) {
    if (!value?.trim()) continue;

    const exactOk = Boolean(exactDictionaryLookup(dict, value));
    const enhanced = lookupInDictionary(dict, value);
    const enhancedOk = enhanced.hit;

    if (exactOk) exactHit++;
    if (enhancedOk) enhancedHit++;
    if (enhancedOk && !exactOk) {
      recoverableByStrip++;
      if (recoverable.length < 30) {
        recoverable.push({
          id,
          field: fieldName,
          preview: preview(value),
          enhancedTranslated: enhanced.translated,
          matchedKey: enhanced.matchedKey,
        });
      }
    }

    if (!enhancedOk && misses.length < maxMisses) {
      misses.push({
        id,
        field: fieldName,
        preview: preview(value),
      });
    }
  }

  const total = items.filter((i) => i.value?.trim()).length;
  return {
    coverage: {
      total,
      exactHit,
      enhancedHit,
      miss: total - enhancedHit,
      recoverableByStrip,
    },
    misses,
    recoverable,
  };
}

function routingZhPath(internalPath: string): string | undefined {
  const entry = routing.pathnames[internalPath as keyof typeof routing.pathnames];
  if (!entry) return undefined;
  if (typeof entry === 'string') return entry;
  return entry.zh;
}

function auditSlugParity(pages: ExportedPage[]): SlugMismatch[] {
  const mismatches: SlugMismatch[] = [];

  for (const page of pages) {
    const canonical = PAGE_SLUG_ZH[page.slug];
    const pathnameKey =
      page.slug === 'home'
        ? '/'
        : (`/${page.slug}` as keyof typeof routing.pathnames);
    const routingSlug = routingZhPath(pathnameKey);

    // Home Chinese URL is /zh/ (locale prefix only) — slugZh "zh" is a CMS artifact.
    if (page.slug === 'home') continue;

    if (canonical && page.slugZh && canonical !== page.slugZh) {
      mismatches.push({
        pageSlug: page.slug,
        source: 'migration slugZh vs slug-zh.ts',
        slugZh: page.slugZh,
        note: `slug-zh.ts expects "${canonical}", migration has "${page.slugZh}"`,
      });
    }

    if (routingSlug && canonical && routingSlug.replace(/^\//, '') !== canonical) {
      mismatches.push({
        pageSlug: page.slug,
        source: 'routing.ts vs slug-zh.ts (live site)',
        slugZh: routingSlug.replace(/^\//, ''),
        note: `routing.ts zh path "${routingSlug}" ≠ canonical/live "${canonical}"`,
      });
    }

    if (routingSlug && page.slugZh && routingSlug.replace(/^\//, '') !== page.slugZh) {
      mismatches.push({
        pageSlug: page.slug,
        source: 'routing.ts vs migration slugZh',
        slugZh: page.slugZh,
        note: `routing.ts uses "${routingSlug}", migration slugZh is "${page.slugZh}"`,
      });
    }
  }

  return mismatches;
}

function scanKeySourceFiles(srcDir: string): string[] {
  const targets = [
    'components/layout/SiteHeader.tsx',
    'app/[locale]/page.tsx',
    'components/portfolio/PortfolioGrid.tsx',
    'components/layout/NavSearch.tsx',
    'components/search/SearchPageClient.tsx',
    'app/[locale]/about/page.tsx',
    'lib/cta-content.ts',
  ];
  const found = new Set<string>();
  const stringPattern = /['"`]([A-Z][A-Za-z0-9 '&!?.,\-]{2,})['"`]/g;

  for (const rel of targets) {
    const full = path.join(srcDir, rel);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf8');
    let match: RegExpExecArray | null;
    while ((match = stringPattern.exec(content)) !== null) {
      const s = match[1].trim();
      if (s.length >= 3) found.add(s);
    }
  }

  return [...found].sort();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startedAt = new Date().toISOString();
  console.log('Translation audit — Phase 1\n');

  const portfolioPath = path.join(PATHS.migrationData, 'portfolio.json');
  const pagesPath = path.join(PATHS.migrationData, 'pages.json');

  if (!fs.existsSync(portfolioPath) || !fs.existsSync(pagesPath)) {
    console.error('Missing migration-data/portfolio.json or pages.json — run npm run migrate:export first.');
    process.exit(1);
  }

  const portfolio = readJson<ExportedPortfolio[]>(portfolioPath);
  const pages = readJson<ExportedPage[]>(pagesPath);

  // --- Dictionary stats ---
  let dictionaryStats: Record<string, unknown> = { available: false };
  let dict = new Map<string, string>();

  try {
    const statusRows = await query<{ status: number; count: number }[]>(
      `SELECT status, COUNT(*) AS count FROM ${table('trp_dictionary_en_us_zh_cn')} GROUP BY status`,
    );
    dict = await loadDictionary();

    dictionaryStats = {
      available: true,
      loadedEntries: dict.size,
      byStatus: Object.fromEntries(statusRows.map((r) => [String(r.status), r.count])),
      totalRows: statusRows.reduce((sum, r) => sum + Number(r.count), 0),
    };
    console.log(`TRP dictionary: ${dict.size} translated entries loaded`);
  } catch (err) {
    console.warn('WP DB unavailable — skipping dictionary lookups:', (err as Error).message);
  }

  // --- Portfolio field coverage ---
  const portfolioFields = ['title', 'thumbTitle', 'headerTitle', 'longTitle', 'description', 'excerpt'] as const;
  const portfolioCoverage: Record<string, FieldCoverage> = {};
  const portfolioMisses: Record<string, FieldMiss[]> = {};
  const portfolioExportGaps: Record<string, number> = {};
  const portfolioRecoverable: FieldMiss[] = [];

  if (dict.size) {
    for (const field of portfolioFields) {
      const items = portfolio.map((p) => ({
        id: p.slug,
        value: p[field] as string | undefined,
      }));
      const { coverage, misses, recoverable } = await measureField(dict, items, field);
      portfolioCoverage[field] = coverage;
      portfolioMisses[field] = misses;
      if (['thumbTitle', 'headerTitle', 'longTitle'].includes(field)) {
        portfolioRecoverable.push(...recoverable);
      }
    }

    portfolioExportGaps.titleZh = portfolio.filter((p) => !p.titleZh).length;
    portfolioExportGaps.descriptionZh = portfolio.filter((p) => !p.descriptionZh).length;
    portfolioExportGaps.thumbTitleZh = portfolio.filter((p) => !p.thumbTitleZh).length;
    portfolioExportGaps.headerTitleZh = portfolio.filter((p) => !p.headerTitleZh).length;
    portfolioExportGaps.longTitleZh = portfolio.filter((p) => !p.longTitleZh).length;
  }

  // --- Page field coverage ---
  const pageHeroItems = pages
    .filter((p) => p.heroTitle)
    .map((p) => ({ id: p.slug, value: p.heroTitle }));

  const pageBodySegmentItems: { id: string; value: string }[] = [];
  for (const page of pages) {
    if (!page.bodyHtml?.trim()) continue;
    const segments = extractHtmlTextSegments(page.bodyHtml);
    if (segments.length) {
      for (const [i, seg] of segments.entries()) {
        pageBodySegmentItems.push({ id: `${page.slug}#${i}`, value: seg });
      }
    } else {
      pageBodySegmentItems.push({
        id: `${page.slug}#full`,
        value: htmlToPlainText(page.bodyHtml),
      });
    }
  }

  let pageHeroCoverage: FieldCoverage | null = null;
  let pageBodyCoverage: FieldCoverage | null = null;
  let pageHeroMisses: FieldMiss[] = [];
  let pageBodyMisses: FieldMiss[] = [];

  if (dict.size) {
    ({ coverage: pageHeroCoverage, misses: pageHeroMisses } = await measureField(
      dict,
      pageHeroItems,
      'heroTitle',
    ));
    ({ coverage: pageBodyCoverage, misses: pageBodyMisses } = await measureField(
      dict,
      pageBodySegmentItems,
      'bodySegment',
      40,
    ));
  }

  const pageExportGaps = {
    missingHeroTitleZh: pages.filter((p) => p.heroTitle && !p.heroTitleZh).length,
    missingBodyHtmlZh: pages.filter((p) => p.bodyHtml?.trim() && !p.bodyHtmlZh).length,
    pagesWithHeroTitle: pages.filter((p) => p.heroTitle).length,
    pagesWithBody: pages.filter((p) => p.bodyHtml?.trim()).length,
  };

  // --- UI chrome ---
  const uiResults = UI_CHROME_STRINGS.map((item) => {
    const lookup = dict.size ? lookupInDictionary(dict, item.text) : { hit: false, triedKeys: [] };
    return {
      ...item,
      dictionaryHit: lookup.hit,
      translated: lookup.translated,
      matchedKey: lookup.matchedKey,
      liveSiteZh: LIVE_SITE_NAV_ZH[item.text],
      inMessagesJson: false, // messages/zh.json has no real catalog yet
    };
  });

  const srcDir = path.join(PATHS.root, 'src');
  const scannedUppercase = dict.size
    ? scanKeySourceFiles(srcDir).map((text) => {
        const lookup = lookupInDictionary(dict, text);
        return {
          text,
          dictionaryHit: lookup.hit,
          translated: lookup.translated,
        };
      })
    : [];

  const scannedWithHits = scannedUppercase.filter((s) => s.dictionaryHit);
  const scannedMisses = scannedUppercase.filter((s) => !s.dictionaryHit);

  // --- Slug parity ---
  const slugMismatches = auditSlugParity(pages);

  const report = {
    generatedAt: startedAt,
    dictionary: dictionaryStats,
    portfolio: {
      count: portfolio.length,
      exportGaps: portfolioExportGaps,
      coverage: portfolioCoverage,
      sampleMisses: portfolioMisses,
      recoverableDisplayTitles: {
        count: portfolioRecoverable.length,
        samples: portfolioRecoverable.slice(0, 30),
      },
    },
    pages: {
      count: pages.length,
      exportGaps: pageExportGaps,
      heroTitle: { coverage: pageHeroCoverage, sampleMisses: pageHeroMisses },
      bodySegments: { coverage: pageBodyCoverage, sampleMisses: pageBodyMisses },
    },
    uiChrome: {
      curated: uiResults,
      curatedSummary: {
        total: uiResults.length,
        dictionaryHits: uiResults.filter((u) => u.dictionaryHit).length,
        needsMessagesJson: uiResults.filter((u) => !u.dictionaryHit).length,
      },
      srcScan: {
        filesScanned: [
          'SiteHeader.tsx',
          'page.tsx',
          'PortfolioGrid.tsx',
          'NavSearch.tsx',
          'SearchPageClient.tsx',
          'about/page.tsx',
          'cta-content.ts',
        ],
        totalUppercaseStrings: scannedUppercase.length,
        dictionaryHits: scannedWithHits.length,
        sampleHits: scannedWithHits.slice(0, 20),
        sampleMisses: scannedMisses.slice(0, 30),
      },
    },
    slugParity: {
      mismatches: slugMismatches,
      canonical: PAGE_SLUG_ZH,
      routingWorkZh: routingZhPath('/work'),
    },
  };

  const outPath = path.join(PATHS.migrationData, 'translation-audit.json');
  writeJson(outPath, report);

  // --- Console summary ---
  console.log('\n--- Portfolio (TRP dictionary coverage) ---');
  if (dict.size) {
    for (const field of portfolioFields) {
      const c = portfolioCoverage[field];
      if (!c) continue;
      console.log(
        `  ${field}: ${c.enhancedHit}/${c.total} enhanced hits | ` +
          `${c.exactHit} exact (current export) | ${c.recoverableByStrip} recoverable via strip`,
      );
    }
    console.log(
      `  Export gaps: ${portfolioExportGaps.titleZh} missing titleZh, ` +
        `${portfolioExportGaps.descriptionZh} missing descriptionZh, ` +
        `${portfolioExportGaps.thumbTitleZh} missing thumbTitleZh, ` +
        `${portfolioExportGaps.headerTitleZh} missing headerTitleZh`,
    );
    console.log(
      `  Recoverable display titles (strip HTML): ${portfolioRecoverable.length} field values`,
    );
  }

  console.log('\n--- Pages ---');
  console.log(
    `  Export: ${pageExportGaps.missingHeroTitleZh}/${pageExportGaps.pagesWithHeroTitle} heroes missing heroTitleZh, ` +
      `${pageExportGaps.missingBodyHtmlZh}/${pageExportGaps.pagesWithBody} bodies missing bodyHtmlZh`,
  );
  if (pageHeroCoverage) {
    console.log(
      `  heroTitle TRP: ${pageHeroCoverage.enhancedHit}/${pageHeroCoverage.total} enhanced | ` +
        `${pageHeroCoverage.recoverableByStrip} recoverable`,
    );
  }
  if (pageBodyCoverage) {
    console.log(
      `  body segments TRP: ${pageBodyCoverage.enhancedHit}/${pageBodyCoverage.total} enhanced | ` +
        `${pageBodyCoverage.recoverableByStrip} recoverable`,
    );
  }

  console.log('\n--- UI chrome (curated) ---');
  console.log(
    `  ${report.uiChrome.curatedSummary.dictionaryHits}/${report.uiChrome.curatedSummary.total} ` +
      'have TRP dictionary entries',
  );
  console.log(
    `  ${report.uiChrome.curatedSummary.needsMessagesJson} need messages/zh.json (no TRP entry)`,
  );
  const uiNeedMessages = uiResults.filter((u) => !u.dictionaryHit);
  if (uiNeedMessages.length) {
    console.log('  Needs messages/zh.json:');
    for (const u of uiNeedMessages.slice(0, 12)) {
      const ref = u.liveSiteZh ? ` (live: ${u.liveSiteZh})` : '';
      console.log(`    - ${u.id}: "${u.text}"${ref}`);
    }
    if (uiNeedMessages.length > 12) console.log(`    … and ${uiNeedMessages.length -  12} more`);
  }

  console.log('\n--- Slug parity ---');
  if (slugMismatches.length) {
    for (const m of slugMismatches) {
      console.log(`  ⚠ ${m.pageSlug}: ${m.note}`);
    }
  } else {
    console.log('  No mismatches between routing.ts, slug-zh.ts, and migration export');
  }

  console.log(`\nFull report: ${outPath}`);
  await closePool();
}

main().catch((err) => {
  console.error(err);
  closePool().finally(() => process.exit(1));
});
