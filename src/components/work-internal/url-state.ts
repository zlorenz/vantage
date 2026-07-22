/**
 * URL query ↔ library UI state sync helpers.
 */

import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  DEFAULT_VIEW,
  type LibraryFilters,
  type LibrarySort,
  type LibraryViewMode,
  type VisibilityFilter,
} from './types';

const SORT_VALUES: LibrarySort[] = [
  'publishedAt-desc',
  'publishedAt-asc',
  'title-asc',
  'client-asc',
];

const VIEW_VALUES: LibraryViewMode[] = ['cards', 'list'];
const VISIBILITY_VALUES: VisibilityFilter[] = ['public', 'hidden'];

function parseVisibility(raw: string | null): VisibilityFilter {
  if (raw && VISIBILITY_VALUES.includes(raw as VisibilityFilter)) {
    return raw as VisibilityFilter;
  }
  return DEFAULT_FILTERS.visibility;
}

export function readFilters(params: URLSearchParams): LibraryFilters {
  return {
    q: params.get('q') || '',
    client: params.get('client') || '',
    director: params.get('director') || '',
    dop: params.get('dop') || '',
    'art-director': params.get('art-director') || '',
    format: params.get('format') || '',
    industry: params.get('industry') || '',
    market: params.get('market') || '',
    visibility: parseVisibility(params.get('visibility')),
  };
}

export function readSort(params: URLSearchParams): LibrarySort {
  const raw = params.get('sort');
  if (raw && SORT_VALUES.includes(raw as LibrarySort)) {
    return raw as LibrarySort;
  }
  return DEFAULT_SORT;
}

export function readView(params: URLSearchParams): LibraryViewMode {
  const raw = params.get('view');
  if (raw && VIEW_VALUES.includes(raw as LibraryViewMode)) {
    return raw as LibraryViewMode;
  }
  return DEFAULT_VIEW;
}

export function buildLibraryQuery(state: {
  filters: LibraryFilters;
  sort: LibrarySort;
  view: LibraryViewMode;
}): Record<string, string> {
  const query: Record<string, string> = {};
  const { filters, sort, view } = state;

  if (filters.q) query.q = filters.q;
  if (filters.client) query.client = filters.client;
  if (filters.director) query.director = filters.director;
  if (filters.dop) query.dop = filters.dop;
  if (filters['art-director']) query['art-director'] = filters['art-director'];
  if (filters.format) query.format = filters.format;
  if (filters.industry) query.industry = filters.industry;
  if (filters.market) query.market = filters.market;
  if (filters.visibility !== DEFAULT_FILTERS.visibility) {
    query.visibility = filters.visibility;
  }
  if (sort !== DEFAULT_SORT) query.sort = sort;
  if (view !== DEFAULT_VIEW) query.view = view;

  return query;
}

export function hasActiveFilters(filters: LibraryFilters): boolean {
  return (
    Boolean(filters.q) ||
    Boolean(filters.client) ||
    Boolean(filters.director) ||
    Boolean(filters.dop) ||
    Boolean(filters['art-director']) ||
    Boolean(filters.format) ||
    Boolean(filters.industry) ||
    Boolean(filters.market)
  );
}
