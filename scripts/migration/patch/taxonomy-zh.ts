/**
 * Curated taxonomy titleZh / slugZh fixes (TRP was literal or missing).
 *
 *   npx tsx scripts/migration/patch/taxonomy-zh.ts
 */

import { getWriteClient, patchSet } from '../lib/sanity-client';

function slugField(current: string) {
  return { _type: 'slug', current };
}

/** EN slug → { titleZh?, slugZh? } */
const PATCHES: Record<
  string,
  Record<string, { titleZh?: string; slugZh: string }>
> = {
  industry: {
    'ai-robotics': { slugZh: '人工智能与机器人' },
    automotive: { slugZh: '汽车' },
    'beauty-cosmetics': { slugZh: '美容与化妆品' },
    electronics: { titleZh: '电子产品', slugZh: '电子产品' },
    fmcg: { slugZh: '快速消费品' },
    fashion: { titleZh: '时尚', slugZh: '时尚' },
    finance: { titleZh: '金融', slugZh: '金融' },
    hospitality: { titleZh: '酒店与接待', slugZh: '酒店与接待' },
    tech: { titleZh: '科技', slugZh: '科技' },
    drones: { slugZh: '无人机' },
  },
  videoFormat: {
    'brand-film': { titleZh: '品牌影片', slugZh: '品牌影片' },
    'branded-documentary': { titleZh: '品牌纪录片', slugZh: '品牌纪录片' },
    'commercial-spot': { titleZh: '商业广告', slugZh: '商业广告' },
    'product-video': { titleZh: '产品视频', slugZh: '产品视频' },
  },
  category: {
    'behind-the-scenes': { slugZh: '幕后花絮' },
    creative: { titleZh: '创意活动', slugZh: '创意活动' },
    'crew-insights': { titleZh: '团队见解', slugZh: '团队见解' },
    press: { titleZh: '新闻报道', slugZh: '新闻报道' },
    uncategorized: { slugZh: '未分类' },
  },
  market: {
    // Already good — keep aligned
    china: { slugZh: '中国' },
    singapore: { slugZh: '新加坡' },
    taiwan: { slugZh: '台湾' },
    usa: { slugZh: '美国' },
    vietnam: { slugZh: '越南' },
  },
};

async function main() {
  const client = getWriteClient();
  let n = 0;

  for (const [type, bySlug] of Object.entries(PATCHES)) {
    for (const [slug, fields] of Object.entries(bySlug)) {
      const doc = await client.fetch<{ _id: string } | null>(
        `*[_type==$type && slug.current==$slug][0]{_id}`,
        { type, slug },
      );
      if (!doc?._id) {
        console.warn(`Missing ${type}/${slug}`);
        continue;
      }
      const set: Record<string, unknown> = {
        slugZh: slugField(fields.slugZh),
      };
      if (fields.titleZh) set.titleZh = fields.titleZh;
      await patchSet(doc._id, set);
      n += 1;
      console.log(`Patched ${type}/${slug}`, Object.keys(set).join(', '));
    }
  }

  console.log(`\nDone. ${n} taxonomy docs patched.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
