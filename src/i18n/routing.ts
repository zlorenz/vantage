/**
 * next-intl routing configuration for Vantage Pictures.
 *
 * English (default): no URL prefix — /about/, /work/, etc.
 * Chinese: /zh/ prefix — /zh/关于/, /zh/工作/, etc.
 *
 * Source: project-context.md, site-architecture.md
 */

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
