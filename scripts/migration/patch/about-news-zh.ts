/**
 * Patch About + News Chinese hero/body fields to match live vantage.pictures/zh.
 *
 *   npx tsx scripts/migration/patch/about-news-zh.ts
 */

import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedPage } from '../export/pages';
import { readJson, writeJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { loadIdMap } from '../lib/id-map';
import { pageId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

const ABOUT_HERO_ZH = '关于<span class="vp-outline">我们</span>';
const NEWS_HERO_ZH = '新闻<span class="vp-outline">与洞察</span>';

const NEWS_BODY_HTML_ZH =
  '<p>随时了解 Vantage Pictures 的最新消息、幕后花絮、创意见解和行业新闻。探索我们的商业电影制作是如何实现的--从概念开发和摄影到后期制作、全球宣传活动和跨国合作。</p>';

function fixAboutBodyHtmlZh(html: string): string {
  return html
    .replace(
      /Who\s*<span class="vp-outline">We Are<\/span>/gi,
      '我们是谁',
    )
    .replace(
      /Who\s+We Are/gi,
      '我们是谁',
    )
    .replace(
      /<span class="vp-outline">Our<\/span>\s*Team/gi,
      '<span class="vp-outline">我们的</span>团队',
    )
    .replace(/Our\s+Team/gi, '我们的团队');
}

async function main() {
  const pagesPath = path.join(PATHS.migrationData, 'pages.json');
  const pages = readJson<ExportedPage[]>(pagesPath);
  const idMap = loadIdMap();

  for (const page of pages) {
    if (page.slug === 'about') {
      page.heroTitleZh = ABOUT_HERO_ZH;
      if (page.bodyHtmlZh) {
        page.bodyHtmlZh = fixAboutBodyHtmlZh(page.bodyHtmlZh);
      }
      await patchSet(pageId('about'), {
        heroTitleZh: ABOUT_HERO_ZH,
        bodyZh: htmlToPortableText(page.bodyHtmlZh || '', idMap),
      });
      console.log('Patched about: heroTitleZh + bodyZh');
    }

    if (page.slug === 'news') {
      page.heroTitleZh = NEWS_HERO_ZH;
      page.bodyHtmlZh = NEWS_BODY_HTML_ZH;
      await patchSet(pageId('news'), {
        heroTitleZh: NEWS_HERO_ZH,
        bodyZh: htmlToPortableText(NEWS_BODY_HTML_ZH, idMap),
      });
      console.log('Patched news: heroTitleZh + bodyZh');
    }
  }

  writeJson(pagesPath, pages);
  console.log('Updated migration-data/pages.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
