/**
 * Patch blog excerptZh from live Chinese news index (or cached JSON).
 *
 *   npx tsx scripts/migration/patch/blog-excerpts-from-live.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedBlogPost } from '../export/blog-posts';
import { readJson, writeJson } from '../lib/fs';
import { blogPostId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';

type PostWithExcerpt = ExportedBlogPost & { excerptZh?: string };

function loadCachedExcerpts(): Map<number, string> {
  const file = path.join(PATHS.migrationData, 'blog-excerpts-zh.json');
  if (!fs.existsSync(file)) return new Map();
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>;
  return new Map(
    Object.entries(raw).map(([wpId, excerpt]) => [Number(wpId), excerpt]),
  );
}

async function fetchLiveExcerptsByTitle(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const pages = [
    'https://vantage.pictures/zh/%E6%96%B0%E9%97%BB/',
    'https://vantage.pictures/zh/%E6%96%B0%E9%97%BB/%E9%A1%B5%E7%A0%81/2/',
    'https://vantage.pictures/zh/%E6%96%B0%E9%97%BB/%E9%A1%B5%E7%A0%81/3/',
  ];

  for (const url of pages) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; vantage-migration/1.0)' },
    });
    const html = await res.text();
    const parts = html.split(/<article[^>]*>/i).slice(1);
    for (const part of parts) {
      const hm = part.match(
        /<h2[^>]*>[\s\S]*?<a[^>]+href="[^"]+"[^>]*>([\s\S]*?)<\/a>/i,
      );
      if (!hm) continue;
      const title = hm[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      let excerpt = '';
      for (const pm of part.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
        const text = pm[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (text.length < 40) continue;
        if (/^\d{4}年/.test(text)) continue;
        excerpt = text;
        break;
      }
      if (title && excerpt) map.set(title, excerpt);
    }
  }

  return map;
}

async function main() {
  const postsPath = path.join(PATHS.migrationData, 'blog-posts.json');
  const posts = readJson<PostWithExcerpt[]>(postsPath);
  const cached = loadCachedExcerpts();

  let liveByTitle = new Map<string, string>();
  try {
    liveByTitle = await fetchLiveExcerptsByTitle();
    console.log(`Fetched ${liveByTitle.size} live card excerpts`);
  } catch (err) {
    console.warn('Live fetch failed, using cached excerpts:', err);
  }

  const excerptCache: Record<string, string> = {};
  let patched = 0;

  for (const post of posts) {
    const excerptZh =
      (post.titleZh && liveByTitle.get(post.titleZh)) ||
      cached.get(post.wpId) ||
      post.excerptZh;

    if (!excerptZh) {
      console.warn(`No excerptZh for ${post.slug}`);
      continue;
    }

    post.excerptZh = excerptZh;
    excerptCache[String(post.wpId)] = excerptZh;
    await patchSet(blogPostId(post.wpId), { excerptZh });
    patched += 1;
    console.log(`Patched excerptZh: ${post.slug}`);
  }

  writeJson(postsPath, posts);
  writeJson(path.join(PATHS.migrationData, 'blog-excerpts-zh.json'), excerptCache);
  console.log(`Done: ${patched}/${posts.length} excerptZh`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
