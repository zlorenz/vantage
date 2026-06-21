import path from 'node:path';
import { PATHS } from '../config';
import { getMeta } from '../lib/acf';
import { getAttachment, extractWpImageIds } from '../lib/attachments';
import { writeJson } from '../lib/fs';
import { translate, translateSlug } from '../lib/translatepress';
import { extractYoast } from '../lib/yoast';
import {
  fetchAllPostMeta,
  fetchPostTermSlugs,
  fetchPosts,
} from '../lib/wp-helpers';

export interface ExportedBlogPost {
  wpId: number;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  publishedAt: string;
  bodyHtml: string;
  bodyHtmlZh?: string;
  featuredImageWpId?: number;
  inlineImageWpIds: number[];
  categories: string[];
  seo: {
    metaDescription?: string;
    metaDescriptionZh?: string;
    focusKeyword?: string;
  };
}

export async function exportBlogPosts(): Promise<ExportedBlogPost[]> {
  const posts = await fetchPosts('post');
  const postIds = posts.map((p) => p.ID);
  const allMeta = await fetchAllPostMeta(postIds);
  const termSlugs = await fetchPostTermSlugs(postIds, ['category']);

  const exported: ExportedBlogPost[] = [];

  for (const post of posts) {
    const meta = allMeta.get(post.ID) ?? {};
    const terms = termSlugs.get(post.ID) ?? {};

    const titleZh = await translate(post.post_title);
    const slugZh = await translateSlug(post.post_name);
    const bodyHtmlZh = await translate(post.post_content);

    const yoast = extractYoast(meta);
    const metaDescriptionZh = yoast.metaDescription
      ? await translate(yoast.metaDescription)
      : undefined;

    const thumbnailId = Number(meta['_thumbnail_id'] ?? 0) || undefined;
    const inlineImageWpIds = extractWpImageIds(post.post_content);

    exported.push({
      wpId: post.ID,
      title: post.post_title,
      titleZh,
      slug: post.post_name,
      slugZh: slugZh && slugZh !== post.post_name ? slugZh : undefined,
      publishedAt: post.post_date,
      bodyHtml: post.post_content,
      bodyHtmlZh: bodyHtmlZh && bodyHtmlZh !== post.post_content ? bodyHtmlZh : undefined,
      featuredImageWpId: thumbnailId,
      inlineImageWpIds,
      categories: terms.category ?? [],
      seo: {
        metaDescription: yoast.metaDescription,
        metaDescriptionZh,
        focusKeyword: yoast.focusKeyword,
      },
    });

    if (thumbnailId) await getAttachment(thumbnailId);
    for (const id of inlineImageWpIds) await getAttachment(id);
  }

  writeJson(path.join(PATHS.migrationData, 'blog-posts.json'), exported);
  return exported;
}
