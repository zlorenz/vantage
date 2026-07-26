import path from 'node:path';
import { PATHS } from '../config';
import { getMeta, parseAcfRepeater } from '../lib/acf';
import { getAttachment } from '../lib/attachments';
import { writeJson } from '../lib/fs';
import { pageSlugZh } from '../lib/slug-zh';
import { translateEnhanced, translateBodyHtml } from '../lib/translatepress';
import { extractYoast } from '../lib/yoast';
import { fetchAllPostMeta, fetchPosts } from '../lib/wp-helpers';

export interface ExportedHeroSlide {
  portfolioWpId: number;
}

export interface ExportedFounder {
  name: string;
  jobTitle: string;
  jobTitleZh?: string;
  imageWpId?: number;
}

export interface ExportedPage {
  wpId: number;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  publishedAt: string;
  showHeroHeader: boolean;
  heroTitle?: string;
  heroTitleZh?: string;
  featuredImageWpId?: number;
  bodyHtml: string;
  bodyHtmlZh?: string;
  heroSlides?: ExportedHeroSlide[];
  /** Homepage “A Bit of Our Work” gallery (WP vp/portfolio-gallery ids). */
  featuredWorkWpIds?: number[];
  founders?: ExportedFounder[];
  noIndex: boolean;
  seo: {
    metaDescription?: string;
    metaDescriptionZh?: string;
  };
}

export async function exportPages(): Promise<ExportedPage[]> {
  const posts = await fetchPosts('page');
  const postIds = posts.map((p) => p.ID);
  const allMeta = await fetchAllPostMeta(postIds);

  const exported: ExportedPage[] = [];

  for (const post of posts) {
    const meta = allMeta.get(post.ID) ?? {};

    const titleZh = await translateEnhanced(post.post_title);
    const slugZh = pageSlugZh(post.post_name);
    const bodyHtmlZh = await translateBodyHtml(post.post_content);

    const yoast = extractYoast(meta);
    const metaDescriptionZh = yoast.metaDescription
      ? await translateEnhanced(yoast.metaDescription)
      : undefined;

    const showHeroHeader = getMeta(meta, 'vp_show_hero_header') !== '0';
    const heroTitle = getMeta(meta, 'vp_hero_title') || undefined;
    const heroTitleZh = heroTitle ? await translateEnhanced(heroTitle) : undefined;

    const thumbnailId = Number(meta['_thumbnail_id'] ?? 0) || undefined;

    let heroSlides: ExportedHeroSlide[] | undefined;
    let featuredWorkWpIds: number[] | undefined;
    if (post.post_name === 'home') {
      const slideRows = parseAcfRepeater(meta, 'slides');
      const slides: ExportedHeroSlide[] = [];
      for (const row of slideRows) {
        const portfolioWpId = Number(row.portfolio_item ?? 0);
        if (!portfolioWpId) continue;
        slides.push({
          portfolioWpId,
        });
      }
      if (slides.length) heroSlides = slides;

      const galleryMatch = post.post_content.match(
        /<!--\s*wp:vp\/portfolio-gallery\s+(\{[\s\S]*?\})\s*\/-->/,
      );
      if (galleryMatch) {
        try {
          const attrs = JSON.parse(galleryMatch[1]) as { ids?: string };
          const ids = (attrs.ids ?? '')
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n) && n > 0);
          if (ids.length) featuredWorkWpIds = ids;
        } catch {
          // ignore malformed gallery attrs
        }
      }
    }

    let founders: ExportedFounder[] | undefined;
    if (post.post_name === 'about') {
      const founderRows = parseAcfRepeater(meta, 'vp_founders');
      const parsed: ExportedFounder[] = [];
      for (const row of founderRows) {
        const name = (row.name ?? '').trim();
        if (!name) continue;
        const imageWpId = Number(row.image ?? 0) || undefined;
        const jobTitle = (row.job_title ?? '').trim() || 'Co-Founder';
        parsed.push({
          name,
          jobTitle,
          jobTitleZh: await translateEnhanced(jobTitle),
          imageWpId,
        });
        if (imageWpId) await getAttachment(imageWpId);
      }
      if (parsed.length) founders = parsed;
    }

    exported.push({
      wpId: post.ID,
      title: post.post_title,
      titleZh,
      slug: post.post_name,
      slugZh,
      publishedAt: post.post_date,
      showHeroHeader: post.post_name === 'home' || post.post_name === 'video-campaign-brief'
        ? false
        : showHeroHeader,
      heroTitle,
      heroTitleZh,
      featuredImageWpId: thumbnailId,
      bodyHtml: post.post_content,
      bodyHtmlZh,
      heroSlides,
      featuredWorkWpIds,
      founders,
      noIndex: post.post_name === 'work-internal',
      seo: {
        metaDescription: yoast.metaDescription,
        metaDescriptionZh,
      },
    });

    if (thumbnailId) await getAttachment(thumbnailId);
  }

  writeJson(path.join(PATHS.migrationData, 'pages.json'), exported);
  return exported;
}
