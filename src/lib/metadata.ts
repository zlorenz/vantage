/**
 * Next.js metadata title helpers — patterns from content-schema.md §7.
 */

import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';
import type { PortfolioEntry, SeoFields, SanityImage } from '@/types/sanity';
import { urlForImage } from '@/lib/sanity';

export const SITE_NAME = 'Vantage Pictures';
export const SITE_DESCRIPTION =
  'Commercial film production company specialising in cinematic brand films and product launch campaigns.';
export const METADATA_BASE = new URL('https://vantage.pictures');
export const SEARCH_PAGE_DESCRIPTION = 'Search the Vantage Pictures portfolio and news.';

export function workPageTitle(): string {
  return `${SITE_NAME} | Commercial Film Portfolio`;
}

export function portfolioEntryTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

export function taxonomyArchiveTitle(termTitle: string): string {
  return `${termTitle} | ${SITE_NAME}`;
}

export function portfolioTaxonomyDescription(termTitle: string): string {
  return `Explore our ${termTitle} commercial video work — brand films, product commercials, and campaigns produced by Vantage Pictures in Vietnam.`;
}

export function blogCategoryDescription(termTitle: string): string {
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
): Metadata {
  const title = locale === 'zh' && entry.titleZh ? entry.titleZh : entry.title;
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

export function newsPageTitle(): string {
  return `Commercial Film Production News | ${SITE_NAME}`;
}

export function blogPostTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

export function pageTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
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
