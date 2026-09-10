/**
 * Text helpers for internal library display and search.
 */

import { resolveEntryDocumentTitle } from '@/lib/display-titles';
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
  return (
    plainText(resolveEntryDocumentTitle(entry, locale)) ||
    plainText(entry.title) ||
    entry.title
  );
}

/** Fixed English short months — avoids Safari vs Node `en-GB` mismatch (`Sep`/`Sept`). */
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function formatPublishDate(iso: string | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  // UTC calendar parts — publishedAt is a date (not a local wall-clock time).
  const day = date.getUTCDate();
  const month = SHORT_MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}
