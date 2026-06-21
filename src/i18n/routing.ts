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
  },
});

export type Locale = (typeof routing.locales)[number];
