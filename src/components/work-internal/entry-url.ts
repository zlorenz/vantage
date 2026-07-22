/**
 * Portfolio page URL helpers for internal library entries.
 */

import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { InternalLibraryEntry } from '@/types/sanity';

export function getPortfolioSlug(
  entry: InternalLibraryEntry,
  locale: Locale,
): string {
  return locale === 'zh' ? entry.slugZh || entry.slug : entry.slug;
}

export function openPortfolioEntry(
  entry: InternalLibraryEntry,
  locale: Locale,
): void {
  const slug = getPortfolioSlug(entry, locale);
  const href = getPathname({
    locale,
    href: { pathname: '/portfolio/[slug]', params: { slug } },
  });
  window.open(href, '_blank', 'noopener,noreferrer');
}
