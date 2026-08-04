/**
 * Client-side sort for the internal work library.
 */

import type { Locale } from '@/i18n/routing';
import type { InternalLibraryEntry } from '@/types/sanity';
import { getPrimaryClientName } from './filter-entries';
import { getDisplayTitle } from './text';
import type { LibrarySort } from './types';

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

export function sortLibraryEntries(
  entries: InternalLibraryEntry[],
  sort: LibrarySort,
  locale: Locale = 'en',
): InternalLibraryEntry[] {
  const copy = [...entries];

  switch (sort) {
    case 'publishedAt-asc':
      return copy.sort((a, b) => {
        const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        if (at !== bt) return at - bt;
        return compareStrings(
          getDisplayTitle(a, locale),
          getDisplayTitle(b, locale),
        );
      });
    case 'title-asc':
      return copy.sort((a, b) =>
        compareStrings(
          getDisplayTitle(a, locale),
          getDisplayTitle(b, locale),
        ),
      );
    case 'client-asc':
      return copy.sort((a, b) =>
        compareStrings(getPrimaryClientName(a), getPrimaryClientName(b)),
      );
    case 'publishedAt-desc':
    default:
      return copy.sort((a, b) => {
        const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        if (at !== bt) return bt - at;
        return compareStrings(
          getDisplayTitle(a, locale),
          getDisplayTitle(b, locale),
        );
      });
  }
}
