/**
 * Builds internal pathnames for next-intl navigation links.
 *
 * IMPORTANT: Never include the `/zh/` locale prefix here — the next-intl
 * `Link` and `useRouter` helpers add it automatically. For routes registered
 * in `routing.pathnames` (e.g. `/work`), pass the internal key; next-intl
 * localizes it to `/作品` under `/zh/`.
 *
 * CMS pages not yet in pathnames use their slug (or slugZh) as the path segment.
 */

import type { NavPage } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

/** Resolve slugZh for a page slug from CMS nav page data. */
function slugZhFor(navPages: NavPage[], slug: string): string | undefined {
  return navPages.find((p) => p.slug === slug)?.slugZh;
}

/** Page slugs that map to a next-intl pathname key (see routing.ts). */
const PATHNAME_KEYS: Record<string, '/' | '/work' | '/work-internal' | '/search'> = {
  home: '/',
  work: '/work',
  'work-internal': '/work-internal',
  search: '/search',
};

/**
 * Returns the pathname for use with next-intl `Link` / `useRouter`.
 *
 * @param locale - Current locale (en | zh)
 * @param slug - English page slug (e.g. "about", "work")
 * @param navPages - Nav page documents from Sanity for slugZh lookup
 */
export function pagePath(
  locale: Locale,
  slug: string,
  navPages: NavPage[],
): string {
  const pathnameKey = PATHNAME_KEYS[slug];
  if (pathnameKey) {
    return pathnameKey;
  }

  if (locale === 'zh') {
    const zhSlug = slugZhFor(navPages, slug) ?? slug;
    return `/${zhSlug}`;
  }

  return `/${slug}`;
}

/** Search pathname for next-intl navigation (locale prefix applied automatically). */
export function searchPath(): string {
  return '/search';
}
