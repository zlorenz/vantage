/**
 * Rebuild blog bodyZh from live Chinese post HTML (TranslatePress-rendered).
 * Preserves EN body media by merging: take live text blocks in order into a
 * fresh PT conversion of scraped HTML (embeds/images re-resolved via idMap).
 *
 *   npx tsx scripts/migration/patch/blog-bodies-from-live-zh.ts
 */

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { PATHS } from '../config';
import type { ExportedBlogPost } from '../export/blog-posts';
import { readJson, writeJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { loadIdMap } from '../lib/id-map';
import { blogPostId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';
import { cleanTrpArtifacts } from '../lib/translation-text';

const execFileAsync = promisify(execFile);

async function fetchHtml(url: string): Promise<string> {
  // Cloudflare blocks bare node fetch; curl with a browser UA works.
  const { stdout } = await execFileAsync(
    'curl',
    ['-sL', '-A', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36', url],
    { maxBuffer: 12 * 1024 * 1024 },
  );
  if (!stdout || stdout.includes('Just a moment') || stdout.length < 500) {
    throw new Error(`Fetch failed or blocked for ${url}`);
  }
  return stdout;
}

function extractEntryContent(html: string): string | null {
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? html;
  const match = article.match(
    /class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)(?=<footer|class="[^"]*entry-footer|class="[^"]*post-navigation|<\/article>)/i,
  );
  if (!match) return null;
  let content = match[1];
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Drop share/related widgets sometimes nested after content
  content = content.replace(/<div class="[^"]*(?:sharedaddy|jp-relatedposts)[^"]*"[\s\S]*$/i, '');
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

  let patched = 0;
  let skipped = 0;

  for (const post of posts) {
    const urls = [
      `https://vantage.pictures/zh/${post.slug}/`,
      ...(post.slugZh ? [`https://vantage.pictures/zh/${post.slugZh}/`] : []),
    ];

    let patchedThis = false;
    for (const url of urls) {
      try {
        // Be gentle with live site / Cloudflare
        await new Promise((r) => setTimeout(r, 800));
        const html = await fetchHtml(url);
        const content = extractEntryContent(html);
        if (!content) {
          console.warn(`No entry-content for ${post.slug} @ ${url}`);
          continue;
        }

        const ratio = chineseRatio(content);
        if (ratio < 0.15) {
          console.warn(`Low ZH ratio (${ratio.toFixed(2)}) for ${post.slug} — try next`);
          continue;
        }

        post.bodyHtmlZh = content;
        const bodyZh = htmlToPortableText(content, idMap);
        await patchSet(blogPostId(post.wpId), { bodyZh });
        patched += 1;
        patchedThis = true;
        console.log(
          `Patched ${post.slug} (zhRatio=${ratio.toFixed(2)}, blocks=${bodyZh.length})`,
        );
        break;
      } catch (err) {
        console.warn(`Failed ${post.slug} @ ${url}:`, err);
      }
    }

    if (!patchedThis) skipped += 1;
  }

  writeJson(postsPath, posts);
  console.log(`Done: ${patched} patched, ${skipped} skipped of ${posts.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
