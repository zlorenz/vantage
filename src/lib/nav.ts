/**
 * Navigation label resolution from CMS page documents.
 */

import type { NavPage } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

/**
 * Resolve the visible nav label for a page.
 * Prefers optional navLabel / navLabelZh; falls back to title / titleZh.
 * ZH falls back to EN title only if titleZh is also empty (titleZh is not
 * schema-required — only EN title has rule.required()).
 */
export function getNavLabel(page: NavPage, locale: Locale): string {
  if (locale === 'zh') {
    const zh = page.navLabelZh?.trim() || page.titleZh?.trim();
    if (zh) return zh;
    return page.title;
  }
  return page.navLabel?.trim() || page.title;
}
