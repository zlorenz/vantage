/**
 * Regenerate portfolio-slugzh-improved.json + src/data/zh-slug-redirects.json
 * from live Sanity + live Yoast sitemaps.
 *
 *   npx tsx scripts/migration/patch/generate-zh-slug-redirects.ts
 *
 * Read-only against Sanity (no write token). Re-run after titleZh edits, then
 * apply portfolio patches with migrate:patch:portfolio-slug-zh.
 */

import path from 'node:path';
import { createClient } from '@sanity/client';

import { PATHS, SANITY } from '../config';
import { writeJson } from '../lib/fs';

const SITE = 'https://vantage.pictures';

type PortfolioDoc = {
  _id: string;
  slug: string;
  slugZh?: string;
  title?: string;
  titleZh?: string;
  isHidden?: boolean;
};

type BlogDoc = { slug: string; slugZh?: string };

type RedirectRow = {
  source: string;
  destination: string;
  permanent: boolean;
  contentType: string;
  enSlug: string;
};

/** Keep existing curated portfolio slugZh where already good. */
const KEEP: Record<string, string> = {
  aquafina: '爱泉',
  'asus-upgrade-to-incredible': '华硕升级到难以置信',
  'ecoflow-delta-series-live-without-limits': 'ecoflow-delta-系列-不受限制的生活',
  'govee-for-every-mood-of-home': '歌诗顿-随心打造居家氛围',
  mutosi: '突变',
};

const CURATED: Record<string, string> = {
  'bitget-getagent-ft-julian-alvarez': 'bitget-getagent-ft-julian-alvarez',
};

/** Live taxonomy ZH → improved Sanity ZH (already in CMS). */
const TAXONOMY_REDIRECTS: {
  contentType: string;
  prefixZh: string;
  enSlug: string;
  liveZh: string;
  sanityZh: string;
}[] = [
  {
    contentType: 'industry',
    prefixZh: '产业',
    enSlug: 'ai-robotics',
    liveZh: '人工智能机器人',
    sanityZh: '人工智能与机器人',
  },
  {
    contentType: 'industry',
    prefixZh: '产业',
    enSlug: 'automotive',
    liveZh: '车载',
    sanityZh: '汽车',
  },
  {
    contentType: 'industry',
    prefixZh: '产业',
    enSlug: 'beauty-cosmetics',
    liveZh: '美容化妆品',
    sanityZh: '美容与化妆品',
  },
  {
    contentType: 'industry',
    prefixZh: '产业',
    enSlug: 'electronics',
    liveZh: '电子学',
    sanityZh: '电子产品',
  },
  {
    contentType: 'industry',
    prefixZh: '产业',
    enSlug: 'fashion',
    liveZh: '时装',
    sanityZh: '时尚',
  },
  {
    contentType: 'industry',
    prefixZh: '产业',
    enSlug: 'fmcg',
    liveZh: 'fmcg',
    sanityZh: '快速消费品',
  },
  {
    contentType: 'industry',
    prefixZh: '产业',
    enSlug: 'hospitality',
    liveZh: '接待',
    sanityZh: '酒店与接待',
  },
  {
    contentType: 'industry',
    prefixZh: '产业',
    enSlug: 'tech',
    liveZh: '技术',
    sanityZh: '科技',
  },
  {
    contentType: 'videoFormat',
    prefixZh: '视频格式',
    enSlug: 'brand-film',
    liveZh: '品牌膜',
    sanityZh: '品牌影片',
  },
  {
    contentType: 'category',
    prefixZh: '类别',
    enSlug: 'behind-the-scenes',
    liveZh: '幕后',
    sanityZh: '幕后花絮',
  },
  {
    contentType: 'category',
    prefixZh: '类别',
    enSlug: 'creative',
    liveZh: '有创意',
    sanityZh: '创意活动',
  },
  {
    contentType: 'category',
    prefixZh: '类别',
    enSlug: 'crew-insights',
    liveZh: '船员见解',
    sanityZh: '团队见解',
  },
  {
    contentType: 'category',
    prefixZh: '类别',
    enSlug: 'press',
    liveZh: '按',
    sanityZh: '新闻报道',
  },
];

function stripAccents(s: string): string {
  return s.normalize('NFKD').replace(/\p{M}/gu, '');
}

function slugifyTitleZh(title: string): string {
  let s = stripAccents(title.trim().toLowerCase());
  s = s.replace(/\u00a0/g, ' ').replace(/[–—−]/g, '-');
  s = s.replace(/["“”„‟«»']/g, '');
  s = s.replace(/[^\w\u4e00-\u9fff：:.-]+/g, '-');
  s = s.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return s;
}

function normalizeUrl(url: string): string {
  let decoded = url.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // keep raw
  }
  if (decoded.replace(/\/$/, '') === `${SITE}/zh`) return `${SITE}/zh/`;
  return decoded.replace(/\/$/, '');
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function extractUrlBlocks(xml: string): string[] {
  return xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
}

function locOf(block: string): string {
  const m = block.match(/<loc>(.*?)<\/loc>/);
  return m?.[1] ? normalizeUrl(m[1]) : '';
}

function liveZhPath(block: string): string | undefined {
  const links = [...block.matchAll(/hreflang="([^"]+)"[^>]*href="([^"]+)"/g)];
  // also href-before-hreflang order
  const links2 = [...block.matchAll(/href="([^"]+)"[^>]*hreflang="([^"]+)"/g)];
  const alts: Record<string, string> = {};
  for (const m of links) alts[m[1]!] = m[2]!;
  for (const m of links2) alts[m[2]!] = m[1]!;
  const href = alts.zh || alts['zh-hans'] || alts['zh-cn'] || alts['zh-Hans'];
  return href ? normalizeUrl(href).slice(SITE.length) : undefined;
}

async function main() {
  const client = createClient({
    projectId: SANITY.projectId,
    dataset: SANITY.dataset,
    apiVersion: SANITY.apiVersion,
    useCdn: false,
  });

  const [portfolio, blogPosts, portfolioSm, postSm] = await Promise.all([
    client.fetch<PortfolioDoc[]>(
      `*[_type == "portfolioEntry" && !defined(trash.trashedAt)]|order(slug.current asc){
        _id, "slug": slug.current, "slugZh": slugZh.current, title, titleZh, isHidden
      }`,
    ),
    client.fetch<BlogDoc[]>(
      `*[_type == "blogPost" && !defined(trash.trashedAt)]{
        "slug": slug.current, "slugZh": slugZh.current
      }`,
    ),
    fetchText(`${SITE}/portfolio-sitemap.xml`),
    fetchText(`${SITE}/post-sitemap.xml`),
  ]);

  const livePortfolioZh = new Map<string, string>();
  for (const block of extractUrlBlocks(portfolioSm)) {
    const loc = locOf(block);
    if (!loc || loc.includes('/zh/') || !loc.includes('/portfolio/')) continue;
    const en = loc.split('/portfolio/')[1];
    if (!en) continue;
    const zhPath = liveZhPath(block);
    if (!zhPath?.includes('/投资组合/')) continue;
    const zh = zhPath.split('/投资组合/')[1];
    if (zh) livePortfolioZh.set(en, zh);
  }

  const liveBlogZh = new Map<string, string>();
  for (const block of extractUrlBlocks(postSm)) {
    const loc = locOf(block);
    if (!loc || loc.includes('/zh/')) continue;
    const en = loc.slice(SITE.length).replace(/^\//, '');
    if (!en || en.includes('/')) continue;
    const zhPath = liveZhPath(block);
    if (!zhPath?.startsWith('/zh/')) continue;
    liveBlogZh.set(en, zhPath.slice('/zh/'.length));
  }

  const entries = [];
  for (const doc of portfolio) {
    if (doc.isHidden) continue;
    const slugZh =
      KEEP[doc.slug] ||
      CURATED[doc.slug] ||
      (doc.titleZh ? slugifyTitleZh(doc.titleZh) : undefined) ||
      doc.slug;
    entries.push({
      _id: doc._id,
      slug: doc.slug,
      titleZh: doc.titleZh ?? '',
      slugZh,
      previousSlugZh: doc.slugZh ?? null,
      liveSlugZh: livePortfolioZh.get(doc.slug) ?? null,
    });
  }

  const byZh = new Map<string, string[]>();
  for (const e of entries) {
    const list = byZh.get(e.slugZh) ?? [];
    list.push(e.slug);
    byZh.set(e.slugZh, list);
  }
  const dups = [...byZh.entries()].filter(([, v]) => v.length > 1);
  if (dups.length) {
    throw new Error(`Duplicate proposed slugZh: ${JSON.stringify(dups)}`);
  }

  const redirects: RedirectRow[] = [];
  const portPrefix = '/zh/投资组合';

  for (const e of entries) {
    const dest = `${portPrefix}/${e.slugZh}`;
    const sources = new Set<string>();
    if (e.liveSlugZh && e.liveSlugZh !== e.slugZh) {
      sources.add(`${portPrefix}/${e.liveSlugZh}`);
    }
    const enFallback = `${portPrefix}/${e.slug}`;
    if (enFallback !== dest) sources.add(enFallback);
    if (e.previousSlugZh && e.previousSlugZh !== e.slugZh) {
      sources.add(`${portPrefix}/${e.previousSlugZh}`);
    }
    for (const source of sources) {
      redirects.push({
        source,
        destination: dest,
        permanent: true,
        contentType: 'portfolioEntry',
        enSlug: e.slug,
      });
    }
  }

  for (const tax of TAXONOMY_REDIRECTS) {
    if (tax.liveZh === tax.sanityZh) continue;
    redirects.push({
      source: `/zh/${tax.prefixZh}/${tax.liveZh}`,
      destination: `/zh/${tax.prefixZh}/${tax.sanityZh}`,
      permanent: true,
      contentType: tax.contentType,
      enSlug: tax.enSlug,
    });
  }

  for (const post of blogPosts) {
    if (!post.slugZh) continue;
    const live = liveBlogZh.get(post.slug);
    if (live && live !== post.slugZh) {
      redirects.push({
        source: `/zh/${live}`,
        destination: `/zh/${post.slugZh}`,
        permanent: true,
        contentType: 'blogPost',
        enSlug: post.slug,
      });
    }
  }

  const bySource = new Map<string, RedirectRow>();
  for (const row of redirects) bySource.set(row.source, row);
  const finalRedirects = [...bySource.values()].sort((a, b) =>
    a.contentType === b.contentType
      ? a.source.localeCompare(b.source)
      : a.contentType.localeCompare(b.contentType),
  );

  writeJson(path.join(PATHS.migrationData, 'portfolio-slugzh-improved.json'), {
    description:
      'Improved portfolio slugZh derived from titleZh (slugified) with curated overrides. Apply via scripts/migration/patch/portfolio-slug-zh.ts',
    generatedAt: new Date().toISOString(),
    entries,
  });

  writeJson(path.join(PATHS.root, 'src/data/zh-slug-redirects.json'), {
    description:
      '301 map: legacy live / interim ZH paths → improved Sanity ZH slugs',
    generatedAt: new Date().toISOString(),
    redirects: finalRedirects,
  });

  console.log(`Wrote ${entries.length} portfolio slugZh proposals`);
  console.log(`Wrote ${finalRedirects.length} redirect rows`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
