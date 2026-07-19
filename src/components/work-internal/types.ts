/**
 * Shared types for the internal work library UI.
 */

export type LibraryViewMode = 'cards' | 'list';

export type LibrarySort =
  | 'publishedAt-desc'
  | 'publishedAt-asc'
  | 'title-asc'
  | 'client-asc';

export type VisibilityFilter = 'public' | 'hidden';

export interface LibraryFilters {
  q: string;
  client: string;
  director: string;
  dop: string;
  'art-director': string;
  format: string;
  industry: string;
  market: string;
  visibility: VisibilityFilter;
}

export const DEFAULT_FILTERS: LibraryFilters = {
  q: '',
  client: '',
  director: '',
  dop: '',
  'art-director': '',
  format: '',
  industry: '',
  market: '',
  visibility: 'public',
};

export const DEFAULT_SORT: LibrarySort = 'publishedAt-desc';
export const DEFAULT_VIEW: LibraryViewMode = 'cards';
