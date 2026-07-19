/**
 * Text helpers for internal library display and search.
 */

import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import type { InternalLibraryEntry } from '@/types/sanity';

/** Strip HTML tags and decode entities (`<span>`, `<br>`, etc.). */
export function plainText(html: string | undefined | null): string {
  if (!html) return '';
  return decodeHtmlEntities(
    html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  );
}

/** Page title (`title` / WP post_title), with entities decoded. */
export function getDisplayTitle(entry: InternalLibraryEntry): string {
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
