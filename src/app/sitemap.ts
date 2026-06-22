import type { MetadataRoute } from 'next';
import {
  bilingualSitemapEntry,
  enOnlySitemapEntry,
  blogPostPaths,
  industryPaths,
  marketPaths,
  portfolioPaths,
  videoFormatPaths,
} from '@/lib/sitemap-urls';
import { sanityClient } from '@/lib/sanity';
import {
  SITEMAP_BLOG_POSTS_QUERY,
  SITEMAP_INDUSTRIES_QUERY,
  SITEMAP_MARKETS_QUERY,
  SITEMAP_PORTFOLIO_QUERY,
  SITEMAP_VIDEO_FORMATS_QUERY,
} from '@/sanity/queries/sitemap';

interface SitemapContentEntry {
  slug: string;
  slugZh?: string;
  publishedAt?: string;
}

interface SitemapTaxonomyEntry {
  slug: string;
  slugZh?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [portfolio, blogPosts, videoFormats, industries, markets] = await Promise.all([
    sanityClient.fetch<SitemapContentEntry[]>(SITEMAP_PORTFOLIO_QUERY),
    sanityClient.fetch<SitemapContentEntry[]>(SITEMAP_BLOG_POSTS_QUERY),
    sanityClient.fetch<SitemapTaxonomyEntry[]>(SITEMAP_VIDEO_FORMATS_QUERY),
    sanityClient.fetch<SitemapTaxonomyEntry[]>(SITEMAP_INDUSTRIES_QUERY),
    sanityClient.fetch<SitemapTaxonomyEntry[]>(SITEMAP_MARKETS_QUERY),
  ]);

  const entries: MetadataRoute.Sitemap = [
    bilingualSitemapEntry('/', '/zh/', {
      changeFrequency: 'weekly',
      priority: 1.0,
    }),
    bilingualSitemapEntry('/work', '/zh/作品', {
      changeFrequency: 'monthly',
      priority: 0.8,
    }),
    bilingualSitemapEntry('/about', '/zh/关于', {
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
    bilingualSitemapEntry('/news', '/zh/新闻', {
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
    bilingualSitemapEntry('/vietnam-production-service', '/zh/越南生产服务', {
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
    bilingualSitemapEntry('/vietnam-location-guide', '/zh/越南旅游指南', {
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
    enOnlySitemapEntry('/video-campaign-brief', {
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
  ];

  for (const entry of portfolio) {
    const paths = portfolioPaths(entry.slug, entry.slugZh);
    entries.push(
      bilingualSitemapEntry(paths.en, paths.zh, {
        changeFrequency: 'monthly',
        priority: 0.8,
        lastModified: entry.publishedAt,
      }),
    );
  }

  for (const post of blogPosts) {
    const paths = blogPostPaths(post.slug, post.slugZh);
    entries.push(
      bilingualSitemapEntry(paths.en, paths.zh, {
        changeFrequency: 'monthly',
        priority: 0.7,
        lastModified: post.publishedAt,
      }),
    );
  }

  for (const term of videoFormats) {
    const paths = videoFormatPaths(term.slug, term.slugZh);
    entries.push(
      bilingualSitemapEntry(paths.en, paths.zh, {
        changeFrequency: 'monthly',
        priority: 0.5,
      }),
    );
  }

  for (const term of industries) {
    const paths = industryPaths(term.slug, term.slugZh);
    entries.push(
      bilingualSitemapEntry(paths.en, paths.zh, {
        changeFrequency: 'monthly',
        priority: 0.5,
      }),
    );
  }

  for (const term of markets) {
    const paths = marketPaths(term.slug, term.slugZh);
    entries.push(
      bilingualSitemapEntry(paths.en, paths.zh, {
        changeFrequency: 'monthly',
        priority: 0.5,
      }),
    );
  }

  return entries;
}
