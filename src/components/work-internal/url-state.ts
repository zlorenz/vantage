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
import {PEOPLE_LIBRARY_FILTER_KEYS} from './people-filters';

const SORT_VALUES: LibrarySort[] = [
  'publishedAt-desc',
  'publishedAt-asc',
  'title-asc',
  'title-desc',
  'client-asc',
  'client-desc',
];

const VIEW_VALUES: LibraryViewMode[] = ['cards', 'list'];
const VISIBILITY_VALUES: VisibilityFilter[] = ['all', 'public', 'hidden'];

function parseVisibility(raw: string | null): VisibilityFilter {
  if (raw && VISIBILITY_VALUES.includes(raw as VisibilityFilter)) {
    return raw as VisibilityFilter;
  }
  return DEFAULT_FILTERS.visibility;
}

export function readFilters(params: URLSearchParams): LibraryFilters {
  const people = Object.fromEntries(
    PEOPLE_LIBRARY_FILTER_KEYS.map((key) => [key, params.get(key) || '']),
  ) as Pick<LibraryFilters, (typeof PEOPLE_LIBRARY_FILTER_KEYS)[number]>;

  return {
    q: params.get('q') || '',
    client: params.get('client') || '',
    ...people,
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
  const {filters, sort, view} = state;

  if (filters.q) query.q = filters.q;
  if (filters.client) query.client = filters.client;
  for (const key of PEOPLE_LIBRARY_FILTER_KEYS) {
    if (filters[key]) query[key] = filters[key];
  }
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
  if (
    Boolean(filters.q) ||
    Boolean(filters.client) ||
    Boolean(filters.format) ||
    Boolean(filters.industry) ||
    Boolean(filters.market) ||
    filters.visibility !== DEFAULT_FILTERS.visibility
  ) {
    return true;
  }
  return PEOPLE_LIBRARY_FILTER_KEYS.some((key) => Boolean(filters[key]));
}
