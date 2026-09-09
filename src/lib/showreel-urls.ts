/**
 * Public / edit URL helpers for showreel documents.
 */

import type {Locale} from '@/i18n/routing'

/** Public share path (page lands in a later prompt — string only for now). */
export function showreelPublicPath(id: string, locale: Locale = 'en'): string {
  const base = `/showreel/${id}`
  return locale === 'zh' ? `/zh${base}` : base
}

export function showreelEditPath(id: string, locale: Locale = 'en'): string {
  const base = `/showreel/${id}/edit`
  return locale === 'zh' ? `/zh${base}` : base
}
