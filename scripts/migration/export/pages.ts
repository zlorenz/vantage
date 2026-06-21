import path from 'node:path';
import { PATHS } from '../config';
import { getMeta, parseAcfRepeater } from '../lib/acf';
import { getAttachment } from '../lib/attachments';
import { writeJson } from '../lib/fs';
import { pageSlugZh } from '../lib/slug-zh';
import { translate } from '../lib/translatepress';
import { extractYoast } from '../lib/yoast';
import { fetchAllPostMeta, fetchPosts } from '../lib/wp-helpers';

export interface ExportedHeroSlide {
  portfolioWpId: number;
  buttonLabel: string;
  buttonLabelZh?: string;
}

export interface ExportedFounder {
  name: string;
  jobTitle: string;
  imageWpId?: number;
  bio: string;
  sameAs: string[];
}

export interface ExportedPage {
  wpId: number;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  showHeroHeader: boolean;
  heroTitle?: string;
  heroTitleZh?: string;
  featuredImageWpId?: number;
  bodyHtml: string;
  bodyHtmlZh?: string;
  heroSlides?: ExportedHeroSlide[];
  founders?: ExportedFounder[];
  noIndex: boolean;
  seo: {
    metaDescription?: string;
    metaDescriptionZh?: string;
    focusKeyword?: string;
  };
}

export async function exportPages(): Promise<ExportedPage[]> {
  const posts = await fetchPosts('page');
  const postIds = posts.map((p) => p.ID);
  const allMeta = await fetchAllPostMeta(postIds);

  const exported: ExportedPage[] = [];

  for (const post of posts) {
    const meta = allMeta.get(post.ID) ?? {};

    const titleZh = await translate(post.post_title);
    const slugZh = pageSlugZh(post.post_name);
    const bodyHtmlZh = await translate(post.post_content);

    const yoast = extractYoast(meta);
    const metaDescriptionZh = yoast.metaDescription
      ? await translate(yoast.metaDescription)
      : undefined;

    const showHeroHeader = getMeta(meta, 'vp_show_hero_header') !== '0';
    const heroTitle = getMeta(meta, 'vp_hero_title') || undefined;
    const heroTitleZh = heroTitle ? await translate(heroTitle) : undefined;

    const thumbnailId = Number(meta['_thumbnail_id'] ?? 0) || undefined;

    let heroSlides: ExportedHeroSlide[] | undefined;
    if (post.post_name === 'home') {
      const slideRows = parseAcfRepeater(meta, 'slides');
      const slides: ExportedHeroSlide[] = [];
      for (const row of slideRows) {
        const portfolioWpId = Number(row.portfolio_item ?? 0);
        if (!portfolioWpId) continue;
        const buttonLabel = (row.button_label ?? 'Watch').trim() || 'Watch';
        const buttonLabelZh = await translate(buttonLabel);
        slides.push({
          portfolioWpId,
          buttonLabel,
          buttonLabelZh: buttonLabelZh !== buttonLabel ? buttonLabelZh : undefined,
        });
      }
      if (slides.length) heroSlides = slides;
    }

    let founders: ExportedFounder[] | undefined;
    if (post.post_name === 'about') {
      const founderRows = parseAcfRepeater(meta, 'vp_founders');
      const parsed: ExportedFounder[] = [];
      for (const row of founderRows) {
        const name = (row.name ?? '').trim();
        if (!name) continue;
        const imageWpId = Number(row.image ?? 0) || undefined;
        const sameAsRaw = (row.same_as ?? '').trim();
        const sameAs = sameAsRaw
          ? sameAsRaw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
          : [];
        parsed.push({
          name,
          jobTitle: (row.job_title ?? '').trim() || 'Co-Founder',
          imageWpId,
          bio: (row.bio ?? '').trim() || name,
          sameAs,
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
      showHeroHeader: post.post_name === 'home' || post.post_name === 'video-campaign-brief'
        ? false
        : showHeroHeader,
      heroTitle,
      heroTitleZh,
      featuredImageWpId: thumbnailId,
      bodyHtml: post.post_content,
      bodyHtmlZh: bodyHtmlZh && bodyHtmlZh !== post.post_content ? bodyHtmlZh : undefined,
      heroSlides,
      founders,
      noIndex: post.post_name === 'work-internal',
      seo: {
        metaDescription: yoast.metaDescription,
        metaDescriptionZh,
        focusKeyword: yoast.focusKeyword,
      },
    });

    if (thumbnailId) await getAttachment(thumbnailId);
  }

  writeJson(path.join(PATHS.migrationData, 'pages.json'), exported);
  return exported;
}
