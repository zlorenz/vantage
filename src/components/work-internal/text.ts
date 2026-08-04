/**
 * Text helpers for internal library display and search.
 */

import { resolveEntryDisplayTitles } from '@/lib/display-titles';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import type { Locale } from '@/i18n/routing';
import type { InternalLibraryEntry } from '@/types/sanity';

/** Strip HTML tags and decode entities (`<span>`, `<br>`, etc.). */
export function plainText(html: string | undefined | null): string {
  if (!html) return '';
  return decodeHtmlEntities(
    html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  );
}

/**
 * Library card/list title — live-compile `documentTitle` from displayTitleParts
 * (same DisplayTitles path as /work + portfolio). Falls back to stored `title`
 * only when parts cannot compile (no brand).
 */
export function getDisplayTitle(
  entry: InternalLibraryEntry,
  locale: Locale = 'en',
): string {
  const compiled = plainText(
    resolveEntryDisplayTitles(entry, locale).documentTitle,
  );
  if (compiled) return compiled;
  return plainText(entry.title) || entry.title;
}

export function formatPublishDate(iso: string | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
