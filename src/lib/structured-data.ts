/**
 * JSON-LD structured data builders for schema.org.
 * Returns plain objects — callers render via <JsonLd />.
 */

import type { Locale } from '@/i18n/routing';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import {
  absoluteUrl,
  blogPostPaths,
  industryPaths,
  marketPaths,
  portfolioPaths,
  videoFormatPaths,
} from '@/lib/sitemap-urls';
import { urlForImage } from '@/lib/sanity';
import { extractVimeoId } from '@/lib/vimeo';
import type { SanityImage, SeoFields } from '@/types/sanity';

const ORGANIZATION_ID = 'https://vantage.pictures/#organization';
const WEBSITE_ID = 'https://vantage.pictures/#website';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface VideoObjectInput {
  title: string;
  description?: string;
  featuredImage?: SanityImage;
  publishedAt?: string;
  vimeoUrl: string;
}

export interface ArticleInput {
  title: string;
  excerpt?: string;
  featuredImage?: SanityImage;
  publishedAt?: string;
  _updatedAt?: string;
  seo?: SeoFields;
}

function plainTextDescription(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function vimeoEmbedUrl(vimeoUrl: string): string | undefined {
  const id = extractVimeoId(vimeoUrl);
  return id ? `https://player.vimeo.com/video/${id}` : undefined;
}

export function homeBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '主页' : 'Home',
    url: locale === 'zh' ? '/zh/' : '/',
  };
}

export function workBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '作品' : 'Work',
    url: locale === 'zh' ? '/zh/作品' : '/work',
  };
}

export function newsBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '新闻动态' : 'News',
    url: locale === 'zh' ? '/zh/新闻' : '/news',
  };
}

export function aboutBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '关于我们' : 'About',
    url: locale === 'zh' ? '/zh/关于' : '/about',
  };
}

export function searchBreadcrumb(locale: Locale): BreadcrumbItem {
  return {
    name: locale === 'zh' ? '搜索' : 'Search',
    url: locale === 'zh' ? '/zh/search' : '/search',
  };
}

export function portfolioPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = portfolioPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function blogPostPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = blogPostPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function videoFormatPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = videoFormatPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function industryPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = industryPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function marketPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const paths = marketPaths(slug, slugZh);
  return locale === 'zh' ? paths.zh : paths.en;
}

export function categoryPageUrl(locale: Locale, slug: string, slugZh?: string): string {
  const zhSlug = slugZh || slug;
  return locale === 'zh' ? `/zh/类别/${zhSlug}` : `/category/${slug}`;
}

export function staticPageUrl(
  locale: Locale,
  enPath: string,
  zhPath: string,
): string {
  return locale === 'zh' ? zhPath : enPath;
}

export function buildOrganization() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: 'Vantage Pictures',
        url: 'https://vantage.pictures',
        // TODO: replace logo URL with final production URL before launch
        logo: 'https://vantage.pictures/brand/vantage-logo.png',
        description:
          'Vietnam-based commercial video production company specialising in brand films, product commercials, and social media campaigns for global brands.',
        email: 'info@vantage.pictures',
        areaServed: 'Worldwide',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Ho Chi Minh City',
          addressCountry: 'VN',
        },
        sameAs: [
          'https://www.facebook.com/vantagepictures',
          'https://www.instagram.com/vantage.pictures/',
          'https://www.linkedin.com/company/vantage-pictures',
          'https://www.youtube.com/@vantage.pictures',
          'https://vimeo.com/vantagepictures',
          'https://www.xinpianchang.com/u11835825',
          'https://www.xiaohongshu.com/user/profile/6666abf600000000070055ff',
          'https://www.google.com/maps/place/Vantage+Pictures/@10.8060001,106.6894896,17z/data=!3m1!4b1!4m6!3m5!1s0x3175299a0d905493:0xffc4e5df7607c582!8m2!3d10.8060001!4d106.6894896!16sg11fv4j_y8d',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: 'https://vantage.pictures',
        name: 'Vantage Pictures',
        publisher: { '@id': ORGANIZATION_ID },
      },
    ],
  };
}

export function buildVideoObject(entry: VideoObjectInput) {
  const embedUrl = vimeoEmbedUrl(entry.vimeoUrl);
  const thumbnailUrl = entry.featuredImage
    ? urlForImage(entry.featuredImage).width(1280).height(720).fit('crop').url()
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: entry.title,
    description: plainTextDescription(entry.description),
    thumbnailUrl,
    uploadDate: entry.publishedAt,
    embedUrl,
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function buildArticle(post: ArticleInput) {
  const description =
    plainTextDescription(post.excerpt) ?? plainTextDescription(post.seo?.metaDescription);
  const image = post.featuredImage
    ? urlForImage(post.featuredImage).width(1200).height(630).fit('crop').url()
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description,
    image,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt ?? post.publishedAt,
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function buildBreadcrumbs(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function buildProfessionalService() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Vantage Pictures',
    url: 'https://vantage.pictures',
    serviceType: 'Commercial Video Production',
    areaServed: 'Worldwide',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ho Chi Minh City',
      addressCountry: 'VN',
    },
  };
}
