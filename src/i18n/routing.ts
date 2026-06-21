/**
 * next-intl routing configuration for Vantage Pictures.
 *
 * English (default): no URL prefix — /about/, /work/, etc.
 * Chinese: translated path segments under /zh/ per site-architecture.md.
 */

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  // English is the canonical default at /. Users switch to Chinese explicitly
  // via the language switcher — do not redirect based on Accept-Language.
  localeDetection: false,
  pathnames: {
    '/': '/',
    '/work': {
      en: '/work',
      zh: '/作品',
    },
    '/work-internal': {
      en: '/work-internal',
      zh: '/work-internal',
    },
    '/portfolio/[slug]': {
      en: '/portfolio/[slug]',
      zh: '/投资组合/[slug]',
    },
    '/video-format/[slug]': {
      en: '/video-format/[slug]',
      zh: '/视频格式/[slug]',
    },
    '/industry/[slug]': {
      en: '/industry/[slug]',
      zh: '/产业/[slug]',
    },
    '/market/[slug]': {
      en: '/market/[slug]',
      zh: '/市场/[slug]',
    },
    '/search': {
      en: '/search',
      zh: '/search',
    },
    '/about': {
      en: '/about',
      zh: '/关于',
    },
    '/news': {
      en: '/news',
      zh: '/新闻',
    },
    '/contact': {
      en: '/contact',
      zh: '/联系',
    },
    '/vietnam-production-service': {
      en: '/vietnam-production-service',
      zh: '/越南生产服务',
    },
    '/vietnam-location-guide': {
      en: '/vietnam-location-guide',
      zh: '/越南旅游指南',
    },
    '/video-campaign-brief': {
      en: '/video-campaign-brief',
      zh: '/视频活动简介',
    },
    '/category/[slug]': {
      en: '/category/[slug]',
      zh: '/类别/[slug]',
    },
    '/[slug]': {
      en: '/[slug]',
      zh: '/[slug]',
    },
  },
});

export type Locale = (typeof routing.locales)[number];
