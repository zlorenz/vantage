/**
 * Builds locale-aware internal paths for navigation links.
 *
 * Chinese slugs come from Sanity page documents (slugZh), not derived from English.
 * Home is a special case: / (EN) and /zh (ZH) per next-intl routing.
 */

import type { NavPage } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

/** Resolve slugZh for a page slug from CMS nav page data. */
function slugZhFor(navPages: NavPage[], slug: string): string | undefined {
  return navPages.find((p) => p.slug === slug)?.slugZh;
}

/**
 * Returns the path for a static page, with trailing slash.
 *
 * @param locale - Current locale (en | zh)
 * @param slug - English page slug (e.g. "about", "work")
 * @param navPages - Nav page documents from Sanity for slugZh lookup
 */
export function pagePath(
  locale: Locale,
  slug: string,
  navPages: NavPage[]
): string {
  if (slug === 'home') {
    return locale === 'zh' ? '/zh' : '/';
  }

  if (locale === 'en') {
    return `/${slug}/`;
  }

  const zhSlug = slugZhFor(navPages, slug) ?? slug;
  return `/zh/${zhSlug}/`;
}

/** Search results page path for the current locale. */
export function searchPath(locale: Locale): string {
  return locale === 'zh' ? '/zh/search' : '/search';
}
