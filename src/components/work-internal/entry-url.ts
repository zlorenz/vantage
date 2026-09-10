/**
 * Portfolio page URL helpers for internal library entries.
 */

import { getPathname } from '@/i18n/navigation';
import {
  getPublicPortfolioSlug,
  getWorkInternalEntrySlug,
  rememberLibraryReturnSearch,
  workInternalEntryHref,
} from '@/lib/internal-app-paths';
import type { Locale } from '@/i18n/routing';
import type { InternalLibraryEntry } from '@/types/sanity';

export function getPortfolioSlug(
  entry: InternalLibraryEntry,
  locale: Locale,
): string {
  return getPublicPortfolioSlug(entry, locale);
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

/** next-intl href for the internal detail page for this entry. */
export function getWorkInternalDetailHref(entry: InternalLibraryEntry) {
  return workInternalEntryHref(getWorkInternalEntrySlug(entry));
}

/** Remember library filters, then return the detail href (for Link onClick). */
export function prepareWorkInternalDetailNavigation(
  entry: InternalLibraryEntry,
) {
  rememberLibraryReturnSearch();
  return getWorkInternalDetailHref(entry);
}
