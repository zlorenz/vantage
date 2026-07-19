/**
 * Patch blogPost.slugZh from live vantage.pictures/zh paths + titleZh fallback.
 *
 * Local TRP has slug originals but almost no post slug translations in-dictionary,
 * so live hybrid Chinese URL segments are curated for posts we can verify.
 *
 *   npx tsx scripts/migration/patch/blog-slug-zh.ts
 */

import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedBlogPost } from '../export/blog-posts';
import { readJson, writeJson } from '../lib/fs';
import { blogPostId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

/** Live /zh/... path segments scraped from the news index (when available). */
const LIVE_SLUG_ZH: Record<string, string> = {
  'a-talking-dog-ai-and-everyday-chaos-behind-govees-new-campaign-via-vantage-pictures':
    'vantage-pictures-发布的-govee-新宣传活动：会说话的狗狗-ai-和日常混',
  'vantage-pictures-translates-next-gen-drone-tech-into-gritty-storytelling-for-brinc':
    'vantage-pictures-将下一代无人机技术转化为-brinc-的硬核故事叙述',
  'vantage-pictures-elevates-mammotion-luba-3-with-cinematic-product-first-campaign':
    'vantage-pictures-携手-ma-motion-luba-3-推出首个电影式产品宣传活动',
  'vantage-pictures-james-duong-on-bringing-chinese-productions-to-vietnam':
    'avantaj-越南-阮仲-谈-越南-制作',
  'bitget-and-vantage-pictures-launch-campaign-starring-world-cup-champion-julian-alvarez':
    'bitget-与-vantage-pictures-联合推出由世界杯冠军朱利安-阿尔瓦雷斯',
  'vantage-pictures-delivers-high-energy-waterproof-chaos-in-global-campaign-for-the-new-realme-c85-smartphone':
    'vantange-pictures-为新款-realme-c85-智能手机的全球广告活动带来了充',
  'vantage-pictures-and-realme-turn-nightlife-into-an-ai-powered-dream-in-live-for-real-campaign':
    'vantage-pictures-和-realme-在live-for-real活动中将夜生活变成了人工智能',
  'govees-haunted-light-show-vantage-pictures-turns-vietnam-suburb-into-a-horror-film-set':
    'govees-闹鬼灯光秀的有利图片将越南郊区变成恐怖电影',
  'directors-brief-12-questions-with-zacharia-lorenz-at-vantage-pictures':
    '董事会简报：vantagepictures的zacharia-lorenz的12个问题',
};

function slugifyTitleZh(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[""„‟«»']/g, '')
    .replace(/[^\w\u4e00-\u9fff：:.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugField(current: string) {
  return { _type: 'slug', current };
}

async function main() {
  const exportPath = path.join(PATHS.migrationData, 'blog-posts.json');
  const posts = readJson<ExportedBlogPost[]>(exportPath);

  for (const post of posts) {
    const slugZh =
      LIVE_SLUG_ZH[post.slug] ||
      (post.titleZh ? slugifyTitleZh(post.titleZh) : undefined);
    if (!slugZh || slugZh === post.slug) continue;

    post.slugZh = slugZh;
    await patchSet(blogPostId(post.wpId), { slugZh: slugField(slugZh) });
    console.log(`Patched ${post.slug} → ${slugZh}`);
  }

  writeJson(exportPath, posts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
