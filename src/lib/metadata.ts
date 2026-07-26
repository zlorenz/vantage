/**
 * Next.js metadata title helpers — Yoast title templates from content-schema.md §7.
 *
 * WP patterns (EN):
 *   Home:                         %%sitename%% %%sep%% %%sitedesc%%
 *   Work:                         %%sitename%% %%sep%% Commercial Film Portfolio
 *   News:                         Commercial Film Production %%title%% %%sep%% %%sitename%%
 *   Campaign brief:               Start Your Project %%sep%% %%sitename%%
 *   Vietnam location guide:       Vietnam Filming Location Guide %%sep%% Production Resource
 *   About / Contact:              %%title%% %%sitename%% %%sep%% %%sitedesc%%
 *   Vietnam production service:   %%title%% %%sep%% %%sitename%%
 *   Portfolio / blog / default:   %%title%% %%sep%% %%sitename%%
 */

import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';
import type { PortfolioEntry, SeoFields, SanityImage } from '@/types/sanity';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { urlForImage } from '@/lib/sanity';

export const SITE_NAME = 'Vantage Pictures';
export const SITE_DESCRIPTION =
  'Commercial film production company specialising in cinematic brand films and product launch campaigns.';
/** Live Yoast-style ZH site tagline (home document title). */
export const SITE_DESCRIPTION_ZH = '商业影像制作公司';
export const METADATA_BASE = new URL('https://vantage.pictures');
export const SEARCH_PAGE_DESCRIPTION = 'Search the Vantage Pictures portfolio and news.';
export const SEARCH_PAGE_DESCRIPTION_ZH = '搜索 Vantage Pictures 作品集与新闻。';

export function workPageTitle(locale: Locale = 'en'): string {
  return locale === 'zh'
    ? `${SITE_NAME} | 商业影片作品集`
    : `${SITE_NAME} | Commercial Film Portfolio`;
}

export function homePageTitle(locale: Locale = 'en'): string {
  return locale === 'zh'
    ? `${SITE_NAME} | ${SITE_DESCRIPTION_ZH}`
    : `${SITE_NAME} | ${SITE_DESCRIPTION}`;
}

export function portfolioEntryTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

export function taxonomyArchiveTitle(termTitle: string): string {
  return `${termTitle} | ${SITE_NAME}`;
}

export function portfolioTaxonomyDescription(
  termTitle: string,
  locale: Locale = 'en',
): string {
  if (locale === 'zh') {
    return `探索 Vantage Pictures 在「${termTitle}」领域的商业影像作品 — 品牌影片、产品广告与活动内容，由越南团队制作。`;
  }
  return `Explore our ${termTitle} commercial video work — brand films, product commercials, and campaigns produced by Vantage Pictures in Vietnam.`;
}

export function blogCategoryDescription(
  termTitle: string,
  locale: Locale = 'en',
): string {
  if (locale === 'zh') {
    return `Vantage Pictures「${termTitle}」相关文章与案例 — 越南商业影像制作公司。`;
  }
  return `${termTitle} articles and case studies from Vantage Pictures, a Vietnam-based commercial video production company.`;
}

export function buildOgImage(
  featuredImage?: SanityImage,
  defaultOgImage?: SanityImage,
): string | undefined {
  const source = featuredImage ?? defaultOgImage;
  if (!source) return undefined;
  return urlForImage(source).width(1200).height(630).fit('crop').url();
}

export function buildPageMetadata(options: {
  locale: Locale;
  enPath: string;
  zhPath: string;
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  robots?: Metadata['robots'];
}): Metadata {
  const {
    locale,
    enPath,
    zhPath,
    title,
    description,
    image,
    type = 'website',
    robots,
  } = options;

  const canonical = locale === 'zh' ? zhPath : enPath;

  return {
    title,
    description,
    robots: robots ?? { index: true, follow: true },
    alternates: {
      canonical,
      languages: {
        en: enPath,
        zh: zhPath,
        'x-default': enPath,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image,
    },
  };
}

export function portfolioEntryMetadata(
  entry: PortfolioEntry,
  locale: Locale,
  defaultOgImage?: SanityImage,
  phrases?: Record<string, string> | null,
): Metadata {
  const title = pickLocaleFieldWithPhrases(
    locale,
    entry.title,
    entry.titleZh,
    phrases,
  );
  const description = seoDescription(entry.seo, locale);
  const metaTitle = portfolioEntryTitle(title);
  const image = buildOgImage(entry.featuredImage, defaultOgImage);

  return buildPageMetadata({
    locale,
    enPath: `/portfolio/${entry.slug}`,
    zhPath: `/zh/投资组合/${entry.slugZh || entry.slug}`,
    title: metaTitle,
    description,
    image,
    type: 'website',
    robots: entry.isHidden ? { index: false, follow: false } : undefined,
  });
}

export function newsPageTitle(locale: Locale = 'en'): string {
  return locale === 'zh'
    ? `商业电影制作新闻 | ${SITE_NAME}`
    : `Commercial Film Production News | ${SITE_NAME}`;
}

export function blogPostTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

/** Default `%%title%% %%sep%% %%sitename%%` */
export function pageTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

/**
 * About / Contact Yoast template:
 * `%%title%% %%sitename%% %%sep%% %%sitedesc%%`
 */
export function aboutContactPageTitle(title: string, locale: Locale = 'en'): string {
  const description = locale === 'zh' ? SITE_DESCRIPTION_ZH : SITE_DESCRIPTION;
  return `${title} ${SITE_NAME} | ${description}`;
}

/** Yoast: `Vietnam Filming Location Guide %%sep%% Production Resource` */
export function vietnamLocationGuideTitle(locale: Locale = 'en'): string {
  return locale === 'zh'
    ? '越南拍摄地点指南 | 制作资源'
    : 'Vietnam Filming Location Guide | Production Resource';
}

/** Yoast: `Start Your Project %%sep%% %%sitename%%` */
export function campaignBriefPageTitle(locale: Locale = 'en'): string {
  return locale === 'zh'
    ? `启动您的项目 | ${SITE_NAME}`
    : `Start Your Project | ${SITE_NAME}`;
}

export function seoDescription(
  seo: SeoFields | undefined,
  locale: Locale,
): string | undefined {
  if (!seo) return undefined;
  return locale === 'zh' && seo.metaDescriptionZh
    ? seo.metaDescriptionZh
    : seo.metaDescription;
}
