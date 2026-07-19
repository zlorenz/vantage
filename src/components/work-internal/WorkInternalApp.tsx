/**
 * WorkInternalApp — client shell for the internal work library.
 *
 * URL-synced search/filters/sort/view + selection for the detail pane.
 */

'use client';

import { useCallback, useEffect, useMemo, useTransition } from 'react';
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
  readSelectedId,
  readSort,
  readView,
} from './url-state';
import { WorkInternalCardView } from './WorkInternalCardView';
import { WorkInternalDetailPane } from './WorkInternalDetailPane';
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
  const selectedId = useMemo(
    () => readSelectedId(searchParams),
    [searchParams],
  );

  const replaceQuery = useCallback(
    (next: {
      filters: LibraryFilters;
      sort: LibrarySort;
      view: LibraryViewMode;
      selectedId: string | null;
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

  const selectedEntry = useMemo(() => {
    if (!selectedId) return null;
    return entries.find((e) => e._id === selectedId) ?? null;
  }, [entries, selectedId]);

  // Drop stale ?id= if the entry is no longer in the dataset
  useEffect(() => {
    if (selectedId && !selectedEntry) {
      replaceQuery({ filters, sort, view, selectedId: null });
    }
  }, [selectedId, selectedEntry, filters, sort, view, replaceQuery]);

  function setFilters(next: LibraryFilters) {
    replaceQuery({ filters: next, sort, view, selectedId });
  }

  function setSort(next: LibrarySort) {
    replaceQuery({ filters, sort: next, view, selectedId });
  }

  function setView(next: LibraryViewMode) {
    replaceQuery({ filters, sort, view: next, selectedId });
  }

  function clearFilters() {
    replaceQuery({
      filters: DEFAULT_FILTERS,
      sort: DEFAULT_SORT,
      view,
      selectedId,
    });
  }

  function selectEntry(id: string) {
    replaceQuery({
      filters,
      sort,
      view,
      selectedId: id === selectedId ? null : id,
    });
  }

  function closePane() {
    replaceQuery({ filters, sort, view, selectedId: null });
  }

  const paneOpen = Boolean(selectedEntry);

  return (
    <div
      className={
        paneOpen
          ? 'vp-internal-app vp-internal-app--pane-open'
          : 'vp-internal-app'
      }
    >
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
            <WorkInternalListView
              entries={filteredSorted}
              selectedId={selectedId}
              onSelect={selectEntry}
            />
          ) : (
            <WorkInternalCardView
              entries={filteredSorted}
              selectedId={selectedId}
              onSelect={selectEntry}
            />
          )}
        </div>

        {selectedEntry ? (
          <>
            <button
              type="button"
              className="vp-internal-pane-backdrop"
              aria-label="Close details"
              onClick={closePane}
            />
            <WorkInternalDetailPane
              entry={selectedEntry}
              locale={locale}
              onClose={closePane}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
