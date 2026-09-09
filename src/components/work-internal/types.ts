/**
 * Shared types for the internal work library UI.
 */

export type LibraryViewMode = 'cards' | 'list';

export type LibrarySort =
  | 'publishedAt-desc'
  | 'publishedAt-asc'
  | 'title-asc'
  | 'client-asc';

export type VisibilityFilter = 'all' | 'public' | 'hidden';

export interface LibraryFilters {
  q: string;
  client: string;
  director: string;
  dop: string;
  'art-director': string;
  editor: string;
  producer: string;
  'line-producer': string;
  colorist: string;
  'sound-design-mix': string;
  composer: string;
  '1st-ad': string;
  /** Combined VFX | Online filter bucket (OR match). */
  'vfx-online': string;
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
  editor: '',
  producer: '',
  'line-producer': '',
  colorist: '',
  'sound-design-mix': '',
  composer: '',
  '1st-ad': '',
  'vfx-online': '',
  format: '',
  industry: '',
  market: '',
  visibility: 'all',
};

export const DEFAULT_SORT: LibrarySort = 'publishedAt-desc';
export const DEFAULT_VIEW: LibraryViewMode = 'cards';
