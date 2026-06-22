/**
 * Re-patches blog post body Portable Text with inline image blocks from WordPress HTML.
 *
 * Original import used html-to-pt without image support — inline images were dropped.
 * Assets were uploaded; this script maps wp:image blocks to Sanity asset references.
 *
 *   npx tsx scripts/migration/patch/blog-body-images-from-wp.ts
 */

import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedBlogPost } from '../export/blog-posts';
import { readJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { blogPostId } from '../lib/ids';
import { loadIdMap } from '../lib/id-map';
import { patchSet } from '../lib/sanity-client';

async function main() {
  const items = readJson<ExportedBlogPost[]>(
    path.join(PATHS.migrationData, 'blog-posts.json')
  );
  const idMap = loadIdMap();

  let patched = 0;
  let imageBlocks = 0;

  for (const item of items) {
    const body = htmlToPortableText(item.bodyHtml, idMap);
    const bodyZh = item.bodyHtmlZh
      ? htmlToPortableText(item.bodyHtmlZh, idMap)
      : undefined;

    const count = body.filter((block) => (block as { _type?: string })._type === 'image').length;
    if (!count && !item.inlineImageWpIds?.length) continue;

    imageBlocks += count;

    const set: Record<string, unknown> = { body };
    if (bodyZh) set.bodyZh = bodyZh;

    await patchSet(blogPostId(item.wpId), set);
    patched++;
    console.log(`Patched ${item.slug} (${count} image blocks)`);
  }

  console.log(`Done: ${patched} posts patched, ${imageBlocks} total image blocks written.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
