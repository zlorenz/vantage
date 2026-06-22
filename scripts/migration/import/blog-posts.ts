import path from 'node:path';
import { PATHS } from '../config';
import type { ExportedBlogPost } from '../export/blog-posts';
import { readJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { docRef, imageField, loadIdMap } from '../lib/id-map';
import { blogPostId, categoryId } from '../lib/ids';
import { createOrReplace } from '../lib/sanity-client';

function slugField(slug: string) {
  return { _type: 'slug' as const, current: slug };
}

export async function importBlogPosts(): Promise<number> {
  const items = readJson<ExportedBlogPost[]>(
    path.join(PATHS.migrationData, 'blog-posts.json')
  );
  const idMap = loadIdMap();

  for (const item of items) {
    const doc: Record<string, unknown> = {
      _id: blogPostId(item.wpId),
      _type: 'blogPost',
      title: item.title,
      slug: slugField(item.slug),
      publishedAt: new Date(item.publishedAt).toISOString(),
      body: htmlToPortableText(item.bodyHtml, idMap),
      categories: item.categories.map((s) => docRef(categoryId(s))),
    };

    if (item.titleZh) doc.titleZh = item.titleZh;
    if (item.slugZh) doc.slugZh = slugField(item.slugZh);
    if (item.bodyHtmlZh) doc.bodyZh = htmlToPortableText(item.bodyHtmlZh, idMap);

    const featuredImage = imageField(idMap, item.featuredImageWpId);
    if (featuredImage) doc.featuredImage = featuredImage;

    const seo: Record<string, string> = {};
    if (item.seo.metaDescription) seo.metaDescription = item.seo.metaDescription;
    if (item.seo.metaDescriptionZh) seo.metaDescriptionZh = item.seo.metaDescriptionZh;
    if (item.seo.focusKeyword) seo.focusKeyword = item.seo.focusKeyword;
    if (Object.keys(seo).length) doc.seo = seo;

    await createOrReplace(doc);
  }

  console.log(`Imported ${items.length} blog posts`);
  return items.length;
}
