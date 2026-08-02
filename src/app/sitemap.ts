import type { MetadataRoute } from 'next';
import {
  bilingualSitemapEntry,
  enOnlySitemapEntry,
  blogPostPaths,
  industryPaths,
  marketPaths,
  pagePaths,
  portfolioPaths,
  videoFormatPaths,
} from '@/lib/sitemap-urls';
import { sanityClient } from '@/lib/sanity';
import {
  SITEMAP_BLOG_POSTS_QUERY,
  SITEMAP_INDUSTRIES_QUERY,
  SITEMAP_MARKETS_QUERY,
  SITEMAP_PAGES_QUERY,
  SITEMAP_PORTFOLIO_QUERY,
  SITEMAP_VIDEO_FORMATS_QUERY,
} from '@/sanity/queries/sitemap';

interface SitemapContentEntry {
  slug: string;
  slugZh?: string;
  publishedAt?: string;
  _updatedAt?: string;
}

interface SitemapTaxonomyEntry {
  slug: string;
  slugZh?: string;
}

/** Stable order + priorities matching the former hardcoded static block. */
const PAGE_SITEMAP_META: Record<
  string,
  {
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
    priority: number;
    enOnly?: boolean;
  }
> = {
  home: { changeFrequency: 'weekly', priority: 1.0 },
  work: { changeFrequency: 'monthly', priority: 0.8 },
  about: { changeFrequency: 'monthly', priority: 0.6 },
  news: { changeFrequency: 'monthly', priority: 0.6 },
  'vietnam-production-service': { changeFrequency: 'monthly', priority: 0.6 },
  'vietnam-location-guide': { changeFrequency: 'monthly', priority: 0.6 },
  'video-campaign-brief': {
    changeFrequency: 'monthly',
    priority: 0.6,
    enOnly: true,
  },
};

const PAGE_SITEMAP_ORDER = Object.keys(PAGE_SITEMAP_META);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, portfolio, blogPosts, videoFormats, industries, markets] =
    await Promise.all([
      sanityClient.fetch<SitemapContentEntry[]>(SITEMAP_PAGES_QUERY),
      sanityClient.fetch<SitemapContentEntry[]>(SITEMAP_PORTFOLIO_QUERY),
      sanityClient.fetch<SitemapContentEntry[]>(SITEMAP_BLOG_POSTS_QUERY),
      sanityClient.fetch<SitemapTaxonomyEntry[]>(SITEMAP_VIDEO_FORMATS_QUERY),
      sanityClient.fetch<SitemapTaxonomyEntry[]>(SITEMAP_INDUSTRIES_QUERY),
      sanityClient.fetch<SitemapTaxonomyEntry[]>(SITEMAP_MARKETS_QUERY),
    ]);

  const entries: MetadataRoute.Sitemap = [];

  const pagesBySlug = new Map(pages.map((page) => [page.slug, page]));
  for (const slug of PAGE_SITEMAP_ORDER) {
    const page = pagesBySlug.get(slug);
    if (!page) continue;

    const paths = pagePaths(slug);
    if (!paths) continue;

    const meta = PAGE_SITEMAP_META[slug];
    const options = {
      changeFrequency: meta.changeFrequency,
      priority: meta.priority,
      lastModified: page._updatedAt,
    };

    if (meta.enOnly) {
      entries.push(enOnlySitemapEntry(paths.en, options));
    } else {
      entries.push(bilingualSitemapEntry(paths.en, paths.zh, options));
    }
  }

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
        lastModified: post._updatedAt,
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
