/**
 * Portfolio page URL helpers for internal library entries.
 */

import {getPathname} from '@/i18n/navigation'
import {
  getPublicPortfolioSlug,
  getWorkInternalEntrySlug,
  rememberLibraryReturnSearch,
  workInternalEntryBrowserPath,
} from '@/lib/internal-app-paths'
import {getSiteOrigin} from '@/lib/site-hosts'
import type {Locale} from '@/i18n/routing'
import type {InternalLibraryEntry} from '@/types/sanity'

export function getPortfolioSlug(
  entry: InternalLibraryEntry,
  locale: Locale,
): string {
  return getPublicPortfolioSlug(entry, locale)
}

export function openPortfolioEntry(
  entry: InternalLibraryEntry,
  locale: Locale,
): void {
  const slug = getPortfolioSlug(entry, locale)
  const path = getPathname({
    locale,
    href: {pathname: '/portfolio/[slug]', params: {slug}},
  })
  // Always open the public case on the marketing origin (app host has no
  // portfolio routes — middleware would bounce unknown paths anyway).
  window.open(`${getSiteOrigin()}${path}`, '_blank', 'noopener,noreferrer')
}

/** Browser-visible href for the internal detail page for this entry. */
export function getWorkInternalDetailHref(
  entry: InternalLibraryEntry,
  onAppHost?: boolean,
): string {
  const hostname =
    onAppHost === true
      ? 'app.vantage.pictures'
      : onAppHost === false
        ? 'vantage.pictures'
        : undefined
  return workInternalEntryBrowserPath(
    getWorkInternalEntrySlug(entry),
    hostname,
  )
}

/** Remember library filters, then return the detail href (for Link onClick). */
export function prepareWorkInternalDetailNavigation(
  entry: InternalLibraryEntry,
  onAppHost?: boolean,
): string {
  rememberLibraryReturnSearch()
  return getWorkInternalDetailHref(entry, onAppHost)
}
