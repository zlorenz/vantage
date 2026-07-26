/**
 * One-off audit: inventory Portable Text patterns across all blogPost bodies.
 * Run: npx tsx scripts/migration/audit/blog-pt-inventory.ts
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { PATHS } from '../config';
import { getWriteClient } from '../lib/sanity-client';

const VIDEO_URL_PATTERN =
  /https?:\/\/(?:www\.)?(?:vimeo\.com\/(?:video\/)?\d+(?:[?#][^\s]*)?|youtube\.com\/watch\?v=[\w-]+(?:[&?#][^\s]*)?|youtu\.be\/[\w-]+(?:[?#][^\s]*)?|youtube\.com\/embed\/[\w-]+(?:[?#][^\s]*)?)/gi;

type Acc = Record<string, number>;
type PtBlock = {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: Array<{ _type?: string; text?: string; marks?: string[] }>;
  markDefs?: Array<{ _key?: string; _type?: string; href?: string }>;
  asset?: unknown;
  alt?: string;
  caption?: string;
  hotspot?: unknown;
  columns?: number;
  images?: unknown[];
  label?: string;
  url?: string;
};

function bump(a: Acc, k: string, n = 1) {
  a[k] = (a[k] ?? 0) + n;
}

function plainText(block: PtBlock): string {
  if (block?._type !== 'block' || !Array.isArray(block.children)) return '';
  return block.children
    .filter((c) => c._type === 'span')
    .map((c) => c.text ?? '')
    .join('');
}

function isEmptyBlock(block: PtBlock): boolean {
  return block?._type === 'block' && !plainText(block).trim() && !block.listItem;
}

function isVideoOnly(block: PtBlock): boolean {
  const text = plainText(block).trim();
  if (!text) return false;
  const urls = [...text.matchAll(VIDEO_URL_PATTERN)].map((m) => m[0]);
  if (!urls.length) return false;
  const rem = urls
    .reduce((a, u) => a.replace(u, ''), text)
    .replace(/\s+/g, '')
    .trim();
  return !rem;
}

function invent(blocks: PtBlock[] | undefined, acc: Acc, field: string) {
  if (!blocks?.length) {
    bump(acc, `${field}:emptyOrMissing`);
    return;
  }
  bump(acc, `${field}:blockCount`, blocks.length);
  for (const b of blocks) {
    const t = b?._type ?? 'unknown';
    bump(acc, `type:${t}`);
    if (t === 'block') {
      bump(acc, `style:${b.style ?? '(none)'}`);
      if (b.listItem) {
        bump(acc, `list:${b.listItem}`);
        bump(acc, `listLevel:${b.level ?? 1}`);
      }
      if (isEmptyBlock(b)) bump(acc, 'pattern:emptyBlock');
      if (isVideoOnly(b)) {
        bump(acc, 'pattern:videoUrlOnly');
        const text = plainText(b);
        if (/vimeo/i.test(text)) bump(acc, 'pattern:videoVimeo');
        if (/youtube|youtu\.be/i.test(text)) bump(acc, 'pattern:videoYoutube');
      }
      const markDefs = Array.isArray(b.markDefs) ? b.markDefs : [];
      const markDefTypes = new Set(markDefs.map((m) => m._type));
      for (const mt of markDefTypes) {
        if (mt) bump(acc, `annotation:${mt}`);
      }
      const children = Array.isArray(b.children) ? b.children : [];
      for (const c of children) {
        if (c?._type !== 'span') {
          bump(acc, `childType:${c?._type ?? 'unknown'}`);
          continue;
        }
        const marks = Array.isArray(c.marks) ? c.marks : [];
        for (const m of marks) {
          if (markDefs.some((d) => d._key === m)) bump(acc, 'mark:link');
          else bump(acc, `mark:${m}`);
        }
      }
    } else if (t === 'image') {
      if (b.asset) bump(acc, 'image:withAsset');
      else bump(acc, 'image:missingAsset');
      if (b.alt) bump(acc, 'image:withAlt');
      if (b.caption) bump(acc, 'image:withCaption');
      if (b.hotspot) bump(acc, 'image:withHotspot');
    } else if (t === 'imageGallery') {
      bump(acc, 'gallery:count');
      bump(acc, 'gallery:images', Array.isArray(b.images) ? b.images.length : 0);
      bump(acc, `gallery:columns:${b.columns ?? 'default'}`);
    } else if (t === 'ctaButton') {
      bump(acc, 'cta:count');
    } else if (t === 'videoEmbed') {
      bump(acc, 'pattern:videoEmbed');
      const url = typeof b.url === 'string' ? b.url : '';
      if (/vimeo/i.test(url)) bump(acc, 'pattern:videoVimeo');
      if (/youtube|youtu\.be/i.test(url)) bump(acc, 'pattern:videoYoutube');
      if (!url) bump(acc, 'videoEmbed:missingUrl');
    } else {
      bump(acc, `unknownType:${t}`);
    }
  }
}

async function main() {
  const client = getWriteClient();
  const posts = await client.fetch<
    Array<{
      _id: string;
      title: string;
      slug: string;
      slugZh?: string;
      _createdAt?: string;
      body?: PtBlock[];
      bodyZh?: PtBlock[];
      bodyLen: number;
      bodyZhLen: number;
      hasBodyZh: boolean;
    }>
  >(`*[_type == "blogPost"] | order(_createdAt desc) {
    _id, title, "slug": slug.current, "slugZh": slugZh.current,
    _createdAt,
    body, bodyZh,
    "bodyLen": count(body),
    "bodyZhLen": count(bodyZh),
    "hasBodyZh": defined(bodyZh) && count(bodyZh) > 0
  }`);

  const totals: Acc = {};
  bump(totals, 'posts', posts.length);
  const postSummaries = [];
  const anomalies: Array<{ id: string; slug: string; issue: string }> = [];

  for (const p of posts) {
    invent(p.body, totals, 'body');
    invent(p.bodyZh, totals, 'bodyZh');

    const bodyTypes = new Set((p.body ?? []).map((b) => b._type));
    const zhTypes = new Set((p.bodyZh ?? []).map((b) => b._type));
    const bodyVideo = (p.body ?? []).filter(isVideoOnly).length;
    const zhVideo = (p.bodyZh ?? []).filter(isVideoOnly).length;
    const bodyImages = (p.body ?? []).filter((b) => b._type === 'image').length;
    const zhImages = (p.bodyZh ?? []).filter((b) => b._type === 'image').length;
    const bodyGalleries = (p.body ?? []).filter((b) => b._type === 'imageGallery').length;
    const zhGalleries = (p.bodyZh ?? []).filter((b) => b._type === 'imageGallery').length;
    const bodyCtas = (p.body ?? []).filter((b) => b._type === 'ctaButton').length;
    const zhCtas = (p.bodyZh ?? []).filter((b) => b._type === 'ctaButton').length;
    const emptyEn = (p.body ?? []).filter(isEmptyBlock).length;
    const emptyZh = (p.bodyZh ?? []).filter(isEmptyBlock).length;
    const stylesEn = [
      ...new Set(
        (p.body ?? [])
          .filter((b) => b._type === 'block')
          .map((b) => b.style ?? '(none)'),
      ),
    ];
    const stylesZh = [
      ...new Set(
        (p.bodyZh ?? [])
          .filter((b) => b._type === 'block')
          .map((b) => b.style ?? '(none)'),
      ),
    ];
    const listsEn = [
      ...new Set((p.body ?? []).filter((b) => b.listItem).map((b) => b.listItem!)),
    ];
    const nestedLists = (p.body ?? []).filter(
      (b) => b.listItem && (b.level ?? 1) > 1,
    ).length;
    const nestedListsZh = (p.bodyZh ?? []).filter(
      (b) => b.listItem && (b.level ?? 1) > 1,
    ).length;

    for (const t of ['imageGallery', 'ctaButton'] as const) {
      if (bodyTypes.has(t) || zhTypes.has(t)) {
        anomalies.push({ id: p._id, slug: p.slug, issue: `disallowedType:${t}` });
      }
    }

    postSummaries.push({
      id: p._id,
      title: p.title,
      slug: p.slug,
      bodyLen: p.bodyLen,
      bodyZhLen: p.bodyZhLen ?? 0,
      hasBodyZh: p.hasBodyZh,
      bodyImages,
      zhImages,
      bodyVideo,
      zhVideo,
      bodyGalleries,
      zhGalleries,
      bodyCtas,
      zhCtas,
      emptyEn,
      emptyZh,
      stylesEn,
      stylesZh,
      listsEn,
      nestedLists,
      nestedListsZh,
      bodyTypes: [...bodyTypes],
      zhTypes: [...zhTypes],
    });
  }

  const pages = await client.fetch<
    Array<{
      _id: string;
      title: string;
      slug: string;
      body?: PtBlock[];
      bodyZh?: PtBlock[];
      bodyLen: number;
      bodyTypes: string[];
      bodyZhTypes: string[];
      styles: string[];
      lists: string[];
      ctaCount: number;
      galleryCount: number;
      imageCount: number;
    }>
  >(`*[_type == "page"] | order(slug.current asc) {
    _id, title, "slug": slug.current,
    body, bodyZh,
    "bodyLen": count(body),
    "bodyTypes": array::unique(body[]._type),
    "bodyZhTypes": array::unique(bodyZh[]._type),
    "styles": array::unique(body[_type=="block"].style),
    "lists": array::unique(body[_type=="block"].listItem),
    "ctaCount": count(body[_type=="ctaButton"]),
    "galleryCount": count(body[_type=="imageGallery"]),
    "imageCount": count(body[_type=="image"])
  }`);

  const pageTotals: Acc = {};
  for (const pg of pages) {
    invent(pg.body, pageTotals, 'pageBody');
    invent(pg.bodyZh, pageTotals, 'pageBodyZh');
  }

  const report = {
    fetchedAt: new Date().toISOString(),
    postCount: posts.length,
    totals,
    anomalies,
    postSummaries,
    pages: pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      bodyLen: p.bodyLen,
      bodyTypes: p.bodyTypes,
      bodyZhTypes: p.bodyZhTypes,
      styles: p.styles,
      lists: p.lists,
      ctaCount: p.ctaCount,
      galleryCount: p.galleryCount,
      imageCount: p.imageCount,
      videoOnly: (p.body ?? []).filter(isVideoOnly).length,
      emptyBlocks: (p.body ?? []).filter(isEmptyBlock).length,
    })),
    pageTotals,
  };

  const outPath = path.join(PATHS.migrationData, '_blog-pt-inventory.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        outPath,
        postCount: report.postCount,
        totals: report.totals,
        anomalies: report.anomalies,
        pages: report.pages,
        pageTotals: report.pageTotals,
        postsWithGalleriesOrCta: report.postSummaries.filter(
          (p) =>
            p.bodyGalleries ||
            p.zhGalleries ||
            p.bodyCtas ||
            p.zhCtas,
        ),
        postsWithImages: report.postSummaries
          .filter((p) => p.bodyImages > 0 || p.zhImages > 0)
          .map((p) => ({
            slug: p.slug,
            bodyImages: p.bodyImages,
            zhImages: p.zhImages,
          })),
        postsWithVideo: report.postSummaries
          .filter((p) => p.bodyVideo > 0 || p.zhVideo > 0)
          .map((p) => ({
            slug: p.slug,
            bodyVideo: p.bodyVideo,
            zhVideo: p.zhVideo,
          })),
        postsWithEmpty: report.postSummaries
          .filter((p) => p.emptyEn || p.emptyZh)
          .map((p) => ({
            slug: p.slug,
            emptyEn: p.emptyEn,
            emptyZh: p.emptyZh,
          })),
        nestedListPosts: report.postSummaries
          .filter((p) => p.nestedLists || p.nestedListsZh)
          .map((p) => ({
            slug: p.slug,
            nestedLists: p.nestedLists,
            nestedListsZh: p.nestedListsZh,
          })),
        styleUsage: report.postSummaries.map((p) => ({
          slug: p.slug,
          stylesEn: p.stylesEn,
          stylesZh: p.stylesZh,
          listsEn: p.listsEn,
          bodyLen: p.bodyLen,
          bodyZhLen: p.bodyZhLen,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
