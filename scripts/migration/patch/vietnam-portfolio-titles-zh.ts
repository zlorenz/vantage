/**
 * Curate Vietnam-market portfolio display titles (thumb/header).
 * Live TRP titles are often wrong segment translations; this uses EN
 * line-break structure with sensible Chinese brand/product lines.
 *
 *   npx tsx scripts/migration/patch/vietnam-portfolio-titles-zh.ts
 */

import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedPortfolio } from '../export/portfolio';
import { readJson, writeJson } from '../lib/fs';
import { portfolioId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

/** wpId → Chinese display fields */
const PATCHES: Record<
  number,
  { thumbTitleZh: string; headerTitleZh?: string; titleZh?: string }
> = {
  3499: {
    thumbTitleZh: 'TPBank<br>App',
    headerTitleZh: 'TPBank <span> App </span>',
    titleZh: 'TPBank App',
  },
  3501: {
    thumbTitleZh: 'BIDV<br>智能银行',
    headerTitleZh: 'BIDV <span> 智能银行 </span>',
    titleZh: 'BIDV 智能银行',
  },
  3287: {
    thumbTitleZh: 'Vinamilk<br>Probi',
    headerTitleZh: 'Vinamilk <span> Probi </span>',
    titleZh: 'Vinamilk Probi',
  },
  3170: {
    thumbTitleZh: 'Techcombank<br>Inspire',
    headerTitleZh: 'Techcombank <span> Inspire </span>',
    titleZh: 'Techcombank Inspire',
  },
  3147: {
    thumbTitleZh: 'Aquafina',
    headerTitleZh: 'Aquafina',
    titleZh: 'Aquafina',
  },
  3142: {
    thumbTitleZh: '可口可乐 x<br>海洋清理',
    headerTitleZh: '可口可乐 x <span> 海洋清理 </span>',
    titleZh: '可口可乐 x 海洋清理',
  },
  3154: {
    thumbTitleZh: '乐事 Max',
    headerTitleZh: '乐事 <span> Max </span>',
    titleZh: '乐事 Max',
  },
  3052: {
    thumbTitleZh: 'Comfort<br>Disco Xin Vía',
    headerTitleZh: 'Comfort <span> Disco Xin Vía </span>',
    titleZh: 'Comfort Disco Xin Vía',
  },
  3040: {
    thumbTitleZh: 'Old Spice<br>檀香',
    headerTitleZh: 'Old Spice <span> 檀香 </span>',
    titleZh: 'Old Spice 檀香',
  },
  3027: {
    thumbTitleZh: 'Mutosi<br>净水器',
    headerTitleZh: 'Mutosi <span> 净水器 </span>',
    titleZh: 'Mutosi 净水器',
  },
  3024: {
    thumbTitleZh: '和发<br>冰箱',
    headerTitleZh: '和发 <span> 冰箱 </span>',
    titleZh: '和发冰箱',
  },
  2990: {
    thumbTitleZh: '康宝莱',
    headerTitleZh: '康宝莱',
    titleZh: '康宝莱营养品',
  },
  3000: {
    thumbTitleZh: 'Techcombank<br>手机银行',
    headerTitleZh: 'Techcombank <span> 手机银行 </span>',
    titleZh: 'Techcombank 手机银行',
  },
  2840: {
    thumbTitleZh: '台湾精品<br>2022',
    headerTitleZh: '台湾精品 <span> 2022 </span>',
    titleZh: '台湾精品 2022',
  },
  2805: {
    thumbTitleZh: '丰田<br>凯美瑞 2022',
    headerTitleZh: '丰田 <span> 凯美瑞 2022 </span>',
    titleZh: '丰田凯美瑞 2022',
  },
  2645: {
    thumbTitleZh: '三星 Galaxy S21<br>Bumper 广告',
    headerTitleZh: '三星 Galaxy S21 <span> Bumper 广告 </span>',
    titleZh: '三星 Galaxy S21',
  },
  2054: {
    thumbTitleZh: '三星 x<br>Discovery',
    headerTitleZh: '三星 x <span> Discovery </span>',
    titleZh: '三星 x Discovery',
  },
  2057: {
    thumbTitleZh: '三星 Galaxy S21<br>热门短片',
    headerTitleZh: '三星 Galaxy S21 <span> 热门短片 </span>',
    titleZh: '三星 Galaxy S21 热门短片',
  },
  2060: {
    thumbTitleZh: '联合利华<br>微笑很重要',
    headerTitleZh: '联合利华 <span> 微笑很重要 </span>',
    titleZh: '联合利华：微笑很重要',
  },
  2065: {
    thumbTitleZh: '三星越南<br>Galaxy S8',
    headerTitleZh: '三星越南 <span> Galaxy S8 </span>',
    titleZh: '三星 Galaxy S8',
  },
};

async function main() {
  const portfolioPath = path.join(PATHS.migrationData, 'portfolio.json');
  const items = readJson<ExportedPortfolio[]>(portfolioPath);

  let patched = 0;
  for (const [wpIdRaw, fields] of Object.entries(PATCHES)) {
    const wpId = Number(wpIdRaw);
    const item = items.find((entry) => entry.wpId === wpId);
    if (item) {
      item.thumbTitleZh = fields.thumbTitleZh;
      if (fields.headerTitleZh) item.headerTitleZh = fields.headerTitleZh;
      if (fields.titleZh) item.titleZh = fields.titleZh;
    }

    await patchSet(portfolioId(wpId), fields);
    patched += 1;
    console.log(`Patched portfolio-${wpId}: ${fields.thumbTitleZh.replace(/<br\s*\/?>/gi, ' / ')}`);
  }

  writeJson(portfolioPath, items);
  console.log(`Done: ${patched} Vietnam portfolio titles`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
