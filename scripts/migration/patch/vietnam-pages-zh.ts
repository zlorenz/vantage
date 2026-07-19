/**
 * Fix Vietnam Production Service + Location Guide Chinese fields:
 * - scrub HTML-contaminated titleZh
 * - restore galleries/CTA button into bodyZh
 * - translate leftover English headings
 * - refresh heroes from live wording
 *
 *   npx tsx scripts/migration/patch/vietnam-pages-zh.ts
 */

import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedPage } from '../export/pages';
import { readJson, writeJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { loadIdMap } from '../lib/id-map';
import { pageId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';
import { cleanTrpArtifacts } from '../lib/translation-text';

const PROD_SLUG = 'vietnam-production-service';
const GUIDE_SLUG = 'vietnam-location-guide';

const PROD_HERO_ZH = '越南<span class="vp-outline">制片服务</span>';
const GUIDE_HERO_ZH = '越南<span class="vp-outline">地点指南</span>';

function extractWpGalleries(html: string): string[] {
  return [
    ...html.matchAll(
      /<!--\s*wp:gallery\b[\s\S]*?<!--\s*\/wp:gallery\s*-->/gi,
    ),
  ].map((match) => match[0]);
}

function replaceRenderedGalleriesWithWp(
  zhHtml: string,
  galleries: string[],
): string {
  let index = 0;
  return zhHtml.replace(
    /<figure class="wp-block-gallery[\s\S]*?<\/figure>/gi,
    () => {
      const gallery = galleries[index];
      index += 1;
      return gallery ?? '';
    },
  );
}

function fixProductionServiceBodyZh(enHtml: string, zhHtml: string): string {
  const galleries = extractWpGalleries(enHtml);
  let html = replaceRenderedGalleriesWithWp(zhHtml, galleries);

  html = html
    .replace(
      /Filming Locations(?:&nbsp;|\s)*<span class="vp-outline">Across Vietnam<\/span>/gi,
      '拍摄地点 <span class="vp-outline">横跨越南</span>',
    )
    .replace(
      /Filming Locations(?:&nbsp;|\s)*Across Vietnam/gi,
      '拍摄地点 横跨越南',
    )
    .replace(
      /<span class="vp-outline">Trusted by<\/span>\s*Global Brands and Agencies/gi,
      '<span class="vp-outline">值得信赖</span> 全球品牌和代理商',
    )
    .replace(
      /Trusted by Global Brands and Agencies/gi,
      '值得信赖 全球品牌和代理商',
    )
    .replace(
      /Shot in <span class="vp-outline">Vietnam<\/span>/gi,
      '在<span class="vp-outline">越南</span>拍摄',
    )
    .replace(/Shot in Vietnam/gi, '在越南拍摄')
    .replace(
      /Plan Your Next Production(?:&nbsp;|\s)*<span class="vp-outline">in Vietnam<\/span>/gi,
      '计划下一次制作 <span class="vp-outline">在越南</span>',
    )
    .replace(
      /Plan Your Next Production(?:&nbsp;|\s)*in Vietnam/gi,
      '计划下一次制作 在越南',
    );

  if (!/wp-bootstrap-blocks\/button/.test(html)) {
    html = html.replace(
      /(拍摄地点\s*<span class="vp-outline">横跨越南<\/span><\/h2>[\s\S]*?<\/p>)/i,
      `$1\n\n<!-- wp:wp-bootstrap-blocks/button {"url":"/vietnam-location-guide","text":"越南取景地指南"} /-->\n`,
    );
  }

  return cleanTrpArtifacts(html);
}

function fixLocationGuideBodyZh(zhHtml: string): string {
  return cleanTrpArtifacts(
    zhHtml
      .replace(
        /Vietnam\s*<span class="vp-outline">Filming Location Guide<\/span>/gi,
        '越南 <span class="vp-outline">拍摄地点指南</span>',
      )
      .replace(
        /Vietnam Filming Location Guide/gi,
        '越南拍摄地点指南',
      ),
  );
}

async function main() {
  const pagesPath = path.join(PATHS.migrationData, 'pages.json');
  const pages = readJson<ExportedPage[]>(pagesPath);
  const idMap = loadIdMap();

  const prod = pages.find((page) => page.slug === PROD_SLUG);
  const guide = pages.find((page) => page.slug === GUIDE_SLUG);
  if (!prod || !guide) {
    throw new Error('Vietnam pages missing from pages.json');
  }

  prod.titleZh = '越南制作服务';
  prod.heroTitleZh = PROD_HERO_ZH;
  if (prod.bodyHtml && prod.bodyHtmlZh) {
    prod.bodyHtmlZh = fixProductionServiceBodyZh(prod.bodyHtml, prod.bodyHtmlZh);
  }

  guide.titleZh = '越南取景地指南';
  guide.heroTitleZh = GUIDE_HERO_ZH;
  if (guide.bodyHtmlZh) {
    guide.bodyHtmlZh = fixLocationGuideBodyZh(guide.bodyHtmlZh);
  }

  await patchSet(pageId(PROD_SLUG), {
    titleZh: prod.titleZh,
    heroTitleZh: prod.heroTitleZh,
    bodyZh: htmlToPortableText(prod.bodyHtmlZh || '', idMap),
  });
  console.log('Patched vietnam-production-service title/hero/bodyZh');

  await patchSet(pageId(GUIDE_SLUG), {
    titleZh: guide.titleZh,
    heroTitleZh: guide.heroTitleZh,
    bodyZh: htmlToPortableText(guide.bodyHtmlZh || '', idMap),
  });
  console.log('Patched vietnam-location-guide title/hero/bodyZh');

  writeJson(pagesPath, pages);
  console.log('Updated migration-data/pages.json');

  // Sanity sanity-check gallery count
  const galleryCount = (prod.bodyHtmlZh || '').match(/wp:gallery/gi)?.length ?? 0;
  const buttonCount =
    (prod.bodyHtmlZh || '').match(/wp-bootstrap-blocks\/button/gi)?.length ?? 0;
  console.log(`Production ZH HTML now has ${galleryCount} galleries, ${buttonCount} buttons`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
