/**
 * Public / edit / index URL helpers for showreel documents.
 */

import type {Locale} from '@/i18n/routing'

/** Producer index of all showreels (app host). */
export function showreelIndexPath(locale: Locale = 'en'): string {
  return locale === 'zh' ? '/zh/showreels' : '/showreels'
}

/** Public share path on the marketing host. */
export function showreelPublicPath(id: string, locale: Locale = 'en'): string {
  const base = `/showreel/${id}`
  return locale === 'zh' ? `/zh${base}` : base
}

export function showreelEditPath(id: string, locale: Locale = 'en'): string {
  const base = `/showreel/${id}/edit`
  return locale === 'zh' ? `/zh${base}` : base
}
