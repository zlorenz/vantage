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

export function workPageTitle(): string {
  return `${SITE_NAME} | Commercial Film Portfolio`;
}

export function portfolioEntryTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

export function taxonomyArchiveTitle(termTitle: string): string {
  return `${termTitle} | ${SITE_NAME}`;
}

export function buildOgImage(
  featuredImage?: SanityImage,
  defaultOgImage?: SanityImage,
): string | undefined {
  const source = featuredImage ?? defaultOgImage;
  if (!source) return undefined;
  return urlForImage(source).width(1200).height(630).fit('crop').url();
}

export function portfolioEntryMetadata(
  entry: PortfolioEntry,
  locale: Locale,
  defaultOgImage?: SanityImage,
): Metadata {
  const title = locale === 'zh' && entry.titleZh ? entry.titleZh : entry.title;
  const description =
    locale === 'zh' && entry.seo?.metaDescriptionZh
      ? entry.seo.metaDescriptionZh
      : entry.seo?.metaDescription;

  const enSlug = entry.slug;
  const zhSlug = entry.slugZh || entry.slug;

  return {
    title: portfolioEntryTitle(title),
    description,
    openGraph: {
      title: portfolioEntryTitle(title),
      description,
      images: buildOgImage(entry.featuredImage, defaultOgImage),
    },
    alternates: {
      languages: {
        en: `/portfolio/${enSlug}`,
        zh: `/zh/投资组合/${zhSlug}`,
      },
    },
  };
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
