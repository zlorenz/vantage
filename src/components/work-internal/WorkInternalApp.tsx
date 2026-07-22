/**
 * WorkInternalApp — client shell for the internal work library.
 *
 * URL-synced search/filters/sort/view.
 */

'use client';

import { useCallback, useMemo, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type {
  ClientTerm,
  CrewMemberTerm,
  InternalLibraryEntry,
  TaxonomyTerm,
} from '@/types/sanity';
import {
  artDirectorNameBySlug,
  buildArtDirectorFilterOptions,
  filterLibraryEntries,
} from './filter-entries';
import { sortLibraryEntries } from './sort-entries';
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  type LibraryFilters,
  type LibrarySort,
  type LibraryViewMode,
} from './types';
import {
  buildLibraryQuery,
  hasActiveFilters,
  readFilters,
  readSort,
  readView,
} from './url-state';
import { WorkInternalCardView } from './WorkInternalCardView';
import { WorkInternalListView } from './WorkInternalListView';
import { WorkInternalToolbar } from './WorkInternalToolbar';

export interface WorkInternalAppProps {
  locale: Locale;
  entries: InternalLibraryEntry[];
  clients: ClientTerm[];
  directors: CrewMemberTerm[];
  dops: CrewMemberTerm[];
  artDirectors: CrewMemberTerm[];
  videoFormats: TaxonomyTerm[];
  industries: TaxonomyTerm[];
  markets: TaxonomyTerm[];
}

export function WorkInternalApp({
  locale,
  entries,
  clients,
  directors,
  dops,
  artDirectors,
  videoFormats,
  industries,
  markets,
}: WorkInternalAppProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = useMemo(
    () => readFilters(searchParams),
    [searchParams],
  );
  const sort = useMemo(() => readSort(searchParams), [searchParams]);
  const view = useMemo(() => readView(searchParams), [searchParams]);

  const replaceQuery = useCallback(
    (next: {
      filters: LibraryFilters;
      sort: LibrarySort;
      view: LibraryViewMode;
    }) => {
      const query = buildLibraryQuery(next);
      startTransition(() => {
        router.replace(
          {
            pathname: '/work-internal',
            query,
          } as Parameters<typeof router.replace>[0],
          { scroll: false },
        );
      });
    },
    [router],
  );

  const artDirectorOptions = useMemo(
    () => buildArtDirectorFilterOptions(artDirectors, entries),
    [artDirectors, entries],
  );

  const filterCtx = useMemo(
    () => ({
      artDirectorNameBySlug: artDirectorNameBySlug(artDirectorOptions),
    }),
    [artDirectorOptions],
  );

  const filteredSorted = useMemo(() => {
    return sortLibraryEntries(
      filterLibraryEntries(entries, filters, filterCtx),
      sort,
    );
  }, [entries, filters, filterCtx, sort]);

  const visibilityTotal = useMemo(() => {
    return entries.filter((entry) =>
      filters.visibility === 'hidden' ? entry.isHidden : !entry.isHidden,
    ).length;
  }, [entries, filters.visibility]);

  function setFilters(next: LibraryFilters) {
    replaceQuery({ filters: next, sort, view });
  }

  function setSort(next: LibrarySort) {
    replaceQuery({ filters, sort: next, view });
  }

  function setView(next: LibraryViewMode) {
    replaceQuery({ filters, sort, view: next });
  }

  function clearFilters() {
    replaceQuery({
      filters: DEFAULT_FILTERS,
      sort: DEFAULT_SORT,
      view,
    });
  }

  return (
    <div className="vp-internal-app">
      <header className="vp-internal-app__header">
        <h1 className="vp-internal-app__title">Work Library</h1>
      </header>

      <WorkInternalToolbar
        entries={entries}
        filters={filters}
        sort={sort}
        view={view}
        resultCount={filteredSorted.length}
        totalCount={visibilityTotal}
        clients={clients}
        directors={directors}
        dops={dops}
        artDirectors={artDirectorOptions}
        filterCtx={filterCtx}
        videoFormats={videoFormats}
        industries={industries}
        markets={markets}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        onViewChange={setView}
        onClear={clearFilters}
      />

      <div className="vp-internal-app__body">
        <div className="vp-internal-app__main">
          {filteredSorted.length === 0 ? (
            <p className="vp-internal-empty">
              No projects match these filters.
              {hasActiveFilters(filters) ? (
                <>
                  {' '}
                  <button
                    type="button"
                    className="vp-internal-clear"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                </>
              ) : null}
            </p>
          ) : view === 'list' ? (
            <WorkInternalListView entries={filteredSorted} locale={locale} />
          ) : (
            <WorkInternalCardView entries={filteredSorted} locale={locale} />
          )}
        </div>
      </div>
    </div>
  );
}
