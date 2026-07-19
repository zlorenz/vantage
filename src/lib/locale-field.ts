/**
 * Pick the locale-appropriate CMS string (English default, Chinese when present).
 */

import type { Locale } from '@/i18n/routing';

export function pickLocaleField(
  locale: Locale,
  en: string | undefined,
  zh?: string | null,
): string {
  if (locale === 'zh' && zh?.trim()) return zh;
  return en ?? '';
}
