/**
 * Patch blog bodyZh from pre-downloaded live HTML in migration-data/blog-zh-html/.
 *
 *   python3 scripts/migration/patch/download-blog-zh-html.py
 *   npx tsx scripts/migration/patch/blog-bodies-from-saved-zh-html.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedBlogPost } from '../export/blog-posts';
import { readJson, writeJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { loadIdMap } from '../lib/id-map';
import { blogPostId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';
import { cleanTrpArtifacts } from '../lib/translation-text';

function extractEntryContent(html: string): string | null {
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? html;
  const match = article.match(
    /class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)(?=<footer|class="[^"]*entry-footer|class="[^"]*post-navigation|<\/article>)/i,
  );
  if (!match) return null;
  let content = match[1];
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
  content = content.replace(
    /<div class="[^"]*(?:sharedaddy|jp-relatedposts)[^"]*"[\s\S]*$/i,
    '',
  );
  return cleanTrpArtifacts(content.trim());
}

function chineseRatio(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ');
  const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  if (cn + latin === 0) return 0;
  return cn / (cn + latin);
}

async function main() {
  const postsPath = path.join(PATHS.migrationData, 'blog-posts.json');
  const posts = readJson<ExportedBlogPost[]>(postsPath);
  const idMap = loadIdMap();
  const htmlDir = path.join(PATHS.migrationData, 'blog-zh-html');

  let patched = 0;
  let skipped = 0;

  for (const post of posts) {
    const file = path.join(htmlDir, `${post.wpId}.html`);
    if (!fs.existsSync(file)) {
      skipped += 1;
      continue;
    }

    const html = fs.readFileSync(file, 'utf8');
    const content = extractEntryContent(html);
    if (!content) {
      console.warn(`No entry-content in ${file}`);
      skipped += 1;
      continue;
    }

    const ratio = chineseRatio(content);
    if (ratio < 0.15) {
      console.warn(`Low ZH ratio ${ratio.toFixed(2)} for ${post.slug}`);
      skipped += 1;
      continue;
    }

    post.bodyHtmlZh = content;
    const bodyZh = htmlToPortableText(content, idMap);
    await patchSet(blogPostId(post.wpId), { bodyZh });
    patched += 1;
    console.log(
      `Patched ${post.slug} (zhRatio=${ratio.toFixed(2)}, blocks=${bodyZh.length})`,
    );
  }

  writeJson(postsPath, posts);
  console.log(`Done: ${patched} patched, ${skipped} skipped of ${posts.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
