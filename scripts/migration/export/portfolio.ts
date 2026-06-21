import path from 'node:path';
import {
  HIDDEN_PORTFOLIO_WP_ID,
  PATHS,
  SLUG_FIX_PORTFOLIO_SLUG,
  SLUG_FIX_PORTFOLIO_WP_ID,
} from '../config';
import { getMeta, getMetaOrFallback, parseAcfRepeater } from '../lib/acf';
import { getAttachment } from '../lib/attachments';
import { buildCredits } from '../lib/credits-config';
import { writeJson } from '../lib/fs';
import { translate, translateSlug } from '../lib/translatepress';
import { extractYoast } from '../lib/yoast';
import {
  fetchAllPostMeta,
  fetchPostTermSlugs,
  fetchPosts,
} from '../lib/wp-helpers';

export interface ExportedAdditionalVideo {
  vimeoUrl: string;
  xinpianchangUrl?: string;
  longTitle: string;
  description?: string;
}

export interface ExportedPortfolio {
  wpId: number;
  title: string;
  titleZh?: string;
  slug: string;
  slugZh?: string;
  thumbTitle: string;
  headerTitle: string;
  longTitle: string;
  description: string;
  descriptionZh?: string;
  featuredImageWpId?: number;
  vimeoUrl: string;
  xinpianchangUrl?: string;
  additionalVideos?: ExportedAdditionalVideo[];
  taxonomies: {
    videoFormats: string[];
    industries: string[];
    markets: string[];
    clients: string[];
    crewMembers: { role: string; slug: string }[];
    platforms: string[];
  };
  isHidden: boolean;
  credits: Record<string, Record<string, unknown>>;
  seo: {
    metaDescription?: string;
    metaDescriptionZh?: string;
    focusKeyword?: string;
  };
}

export async function exportPortfolio(): Promise<ExportedPortfolio[]> {
  const posts = await fetchPosts('portfolio');
  const postIds = posts.map((p) => p.ID);
  const allMeta = await fetchAllPostMeta(postIds);
  const termSlugs = await fetchPostTermSlugs(postIds, [
    'video-format',
    'industry',
    'market',
    'client',
    'director',
    'dop',
    'art-director',
    'platform',
  ]);

  const exported: ExportedPortfolio[] = [];

  for (const post of posts) {
    const meta = allMeta.get(post.ID) ?? {};
    const terms = termSlugs.get(post.ID) ?? {};

    let slug = post.post_name;
    if (post.ID === SLUG_FIX_PORTFOLIO_WP_ID) {
      slug = SLUG_FIX_PORTFOLIO_SLUG;
    }

    const titleZh = await translate(post.post_title);
    const slugZh = await translateSlug(slug);
    const description = getMetaOrFallback(meta, 'description', 'excerpt') || post.post_content;
    const descriptionZh = await translate(description);

    const yoast = extractYoast(meta);
    const metaDescriptionZh = yoast.metaDescription
      ? await translate(yoast.metaDescription)
      : undefined;

    const thumbTitle =
      getMeta(meta, 'thumb_title') || getMeta(meta, 'header_title') || post.post_title;
    const headerTitle =
      getMeta(meta, 'header_title') || getMeta(meta, 'thumb_title') || post.post_title;
    const longTitle =
      getMeta(meta, 'long_title') || getMeta(meta, 'header_title') || post.post_title;

    const vimeoUrl = getMeta(meta, 'vimeo_link');
    const xinpianchangUrl = getMeta(meta, 'xinpianchang_link') || undefined;

    const additionalRows = parseAcfRepeater(meta, 'additional_videos');
    const additionalVideos: ExportedAdditionalVideo[] = [];
    for (const row of additionalRows) {
      const vimeo = (row.vimeo_link ?? '').trim();
      if (!vimeo) continue;
      additionalVideos.push({
        vimeoUrl: vimeo,
        xinpianchangUrl: (row.xinpianchang_link ?? '').trim() || undefined,
        longTitle: (row.long_title ?? '').trim() || longTitle,
        description: (row.description ?? '').trim() || undefined,
      });
    }

    const thumbnailId = Number(meta['_thumbnail_id'] ?? 0) || undefined;

    const crewMembers: { role: string; slug: string }[] = [];
    for (const [tax, role] of [
      ['director', 'director'],
      ['dop', 'dop'],
      ['art-director', 'art-director'],
    ] as const) {
      for (const s of terms[tax] ?? []) {
        crewMembers.push({ role, slug: s });
      }
    }

    exported.push({
      wpId: post.ID,
      title: post.post_title,
      titleZh,
      slug,
      slugZh: slugZh && slugZh !== slug ? slugZh : undefined,
      thumbTitle,
      headerTitle,
      longTitle,
      description,
      descriptionZh,
      featuredImageWpId: thumbnailId,
      vimeoUrl: vimeoUrl || 'https://vimeo.com/placeholder',
      xinpianchangUrl,
      additionalVideos: additionalVideos.length ? additionalVideos : undefined,
      taxonomies: {
        videoFormats: terms['video-format'] ?? [],
        industries: terms.industry ?? [],
        markets: terms.market ?? [],
        clients: terms.client ?? [],
        crewMembers,
        platforms: terms.platform ?? [],
      },
      isHidden: post.ID === HIDDEN_PORTFOLIO_WP_ID,
      credits: buildCredits(meta),
      seo: {
        metaDescription: yoast.metaDescription,
        metaDescriptionZh,
        focusKeyword: yoast.focusKeyword,
      },
    });

    if (thumbnailId) await getAttachment(thumbnailId);
  }

  writeJson(path.join(PATHS.migrationData, 'portfolio.json'), exported);
  return exported;
}
