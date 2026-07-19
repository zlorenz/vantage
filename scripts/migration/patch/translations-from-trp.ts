/**
 * Patch Chinese translation fields in Sanity from migration-data JSON.
 * Run after migrate:export:content (or full migrate:export).
 *
 *   npm run migrate:export:content
 *   npm run migrate:patch:translations
 */

import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedPage } from '../export/pages';
import type { ExportedPortfolio } from '../export/portfolio';
import { readJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { imageField, loadIdMap } from '../lib/id-map';
import { pageId, portfolioId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

function countDefined(fields: Record<string, unknown>): number {
  return Object.values(fields).filter((v) => v !== undefined && v !== null).length;
}

async function patchPortfolio(items: ExportedPortfolio[]): Promise<number> {
  let patched = 0;

  for (const item of items) {
    const fields: Record<string, unknown> = {};

    if (item.titleZh) fields.titleZh = item.titleZh;
    if (item.excerptZh) fields.excerptZh = item.excerptZh;
    if (item.descriptionZh) fields.descriptionZh = item.descriptionZh;
    if (item.thumbTitleZh) fields.thumbTitleZh = item.thumbTitleZh;
    if (item.headerTitleZh) fields.headerTitleZh = item.headerTitleZh;
    if (item.longTitleZh) fields.longTitleZh = item.longTitleZh;

    if (item.seo.metaDescriptionZh) {
      fields.seo = {
        ...(item.seo.metaDescription ? { metaDescription: item.seo.metaDescription } : {}),
        metaDescriptionZh: item.seo.metaDescriptionZh,
        ...(item.seo.focusKeyword ? { focusKeyword: item.seo.focusKeyword } : {}),
      };
    }

    if (!countDefined(fields)) continue;

    await patchSet(portfolioId(item.wpId), fields);
    patched += 1;
  }

  return patched;
}

async function patchPages(items: ExportedPage[]): Promise<number> {
  const idMap = loadIdMap();
  let patched = 0;

  for (const item of items) {
    const fields: Record<string, unknown> = {};

    if (item.titleZh) fields.titleZh = item.titleZh;
    if (item.heroTitleZh) fields.heroTitleZh = item.heroTitleZh;
    if (item.bodyHtmlZh) {
      fields.bodyZh = htmlToPortableText(item.bodyHtmlZh, idMap);
    }

    if (item.seo.metaDescriptionZh) {
      fields.seo = {
        ...(item.seo.metaDescription ? { metaDescription: item.seo.metaDescription } : {}),
        metaDescriptionZh: item.seo.metaDescriptionZh,
        ...(item.seo.focusKeyword ? { focusKeyword: item.seo.focusKeyword } : {}),
      };
    }

    if (item.founders?.length) {
      fields.founders = item.founders.map((f) => {
        const image = imageField(idMap, f.imageWpId);
        return {
          _type: 'founder',
          name: f.name,
          jobTitle: f.jobTitle,
          ...(f.jobTitleZh ? { jobTitleZh: f.jobTitleZh } : {}),
          bio: f.bio,
          ...(f.bioZh ? { bioZh: f.bioZh } : {}),
          ...(image ? { image } : {}),
          ...(f.sameAs.length ? { sameAs: f.sameAs } : {}),
        };
      });
    }

    if (!countDefined(fields)) continue;

    await patchSet(pageId(item.slug), fields);
    patched += 1;
  }

  return patched;
}

async function main() {
  const portfolioPath = path.join(PATHS.migrationData, 'portfolio.json');
  const pagesPath = path.join(PATHS.migrationData, 'pages.json');

  const portfolio = readJson<ExportedPortfolio[]>(portfolioPath);
  const pages = readJson<ExportedPage[]>(pagesPath);

  const portfolioPatched = await patchPortfolio(portfolio);
  const pagesPatched = await patchPages(pages);

  const stats = {
    portfolio: {
      total: portfolio.length,
      thumbTitleZh: portfolio.filter((p) => p.thumbTitleZh).length,
      headerTitleZh: portfolio.filter((p) => p.headerTitleZh).length,
      longTitleZh: portfolio.filter((p) => p.longTitleZh).length,
      patched: portfolioPatched,
    },
    pages: {
      total: pages.length,
      heroTitleZh: pages.filter((p) => p.heroTitleZh).length,
      bodyHtmlZh: pages.filter((p) => p.bodyHtmlZh).length,
      patched: pagesPatched,
    },
  };

  console.log('Translation patch complete:', JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
