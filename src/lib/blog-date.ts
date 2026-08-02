/**
 * Blog publish-date formatting — shared by detail page and cards.
 */

import type { Locale } from '@/i18n/routing';

/** "May 25, 2026" (en-US) / "2026年5月25日" (zh-CN). */
export function formatBlogPublishDate(dateString: string, locale: Locale): string {
  return new Date(dateString).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
