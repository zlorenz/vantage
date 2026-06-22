/**
 * Sitemap URL builders — paths match hreflang alternates in page metadata.
 */

import type { MetadataRoute } from 'next';

export const SITE_URL = 'https://vantage.pictures';

export function absoluteUrl(path: string): string {
  if (!path || path === '/') {
    return `${SITE_URL}/`;
  }
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

type SitemapEntryOptions = {
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
  lastModified?: string | Date;
};

export function bilingualSitemapEntry(
  enPath: string,
  zhPath: string,
  options: SitemapEntryOptions,
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(enPath),
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: {
      languages: {
        en: absoluteUrl(enPath),
        zh: absoluteUrl(zhPath),
      },
    },
  };
}

export function enOnlySitemapEntry(
  enPath: string,
  options: SitemapEntryOptions,
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(enPath),
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: {
      languages: {
        en: absoluteUrl(enPath),
      },
    },
  };
}

export function portfolioPaths(slug: string, slugZh?: string) {
  const zhSlug = slugZh || slug;
  return {
    en: `/portfolio/${slug}`,
    zh: `/zh/投资组合/${zhSlug}`,
  };
}

/** Root-level blog post URLs — not under /news/. */
export function blogPostPaths(slug: string, slugZh?: string) {
  const zhSlug = slugZh || slug;
  return {
    en: `/${slug}`,
    zh: `/zh/${zhSlug}`,
  };
}

export function videoFormatPaths(slug: string, slugZh?: string) {
  const zhSlug = slugZh || slug;
  return {
    en: `/video-format/${slug}`,
    zh: `/zh/视频格式/${zhSlug}`,
  };
}

export function industryPaths(slug: string, slugZh?: string) {
  const zhSlug = slugZh || slug;
  return {
    en: `/industry/${slug}`,
    zh: `/zh/产业/${zhSlug}`,
  };
}

export function marketPaths(slug: string, slugZh?: string) {
  const zhSlug = slugZh || slug;
  return {
    en: `/market/${slug}`,
    zh: `/zh/市场/${zhSlug}`,
  };
}
