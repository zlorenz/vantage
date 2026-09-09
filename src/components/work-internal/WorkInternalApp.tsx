/**
 * WorkInternalApp — client shell for the internal work library.
 *
 * Filter state lives in React (not URL-driven navigation). The query string is
 * mirrored with history.replaceState so shareable links still work without
 * triggering an App Router RSC refetch of the whole Sanity library on every
 * keystroke — that was making search unusable on slow connections.
 */

'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/i18n/routing';
import type {
  InternalLibraryEntry,
  TaxonomyTerm,
} from '@/types/sanity';
import {
  appearanceDataAttrs,
  DEFAULT_APPEARANCE,
  readAppearance,
  writeAppearance,
  type LibraryAppearance,
} from './appearance';
import {
  buildArtDirectorFilterOptions,
  buildClientFilterOptions,
  buildDirectorFilterOptions,
  buildDopFilterOptions,
  buildEditorFilterOptions,
  buildSearchTextByEntryId,
  filterLibraryEntries,
  identityNameById,
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
import { takeShowreelCreatePending } from './showreel-create-pending';
import { WorkInternalCardView } from './WorkInternalCardView';
import { WorkInternalListView } from './WorkInternalListView';
import { WorkInternalShowreelBar } from './WorkInternalShowreelBar';
import { WorkInternalToolbar } from './WorkInternalToolbar';

export interface WorkInternalAppProps {
  locale: Locale;
  entries: InternalLibraryEntry[];
  videoFormats: TaxonomyTerm[];
  industries: TaxonomyTerm[];
  markets: TaxonomyTerm[];
}

function replaceLibraryUrl(state: {
  filters: LibraryFilters;
  sort: LibrarySort;
  view: LibraryViewMode;
}): void {
  const query = buildLibraryQuery(state);
  const params = new URLSearchParams(query);
  const qs = params.toString();
  const next = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current) return;
  window.history.replaceState(window.history.state, '', next);
}

export function WorkInternalApp({
  locale,
  entries,
  videoFormats,
  industries,
  markets,
}: WorkInternalAppProps) {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() => readFilters(searchParams));
  const [sort, setSort] = useState(() => readSort(searchParams));
  const [view, setView] = useState(() => readView(searchParams));
  const [appearance, setAppearance] =
    useState<LibraryAppearance>(DEFAULT_APPEARANCE);
  const [appearanceReady, setAppearanceReady] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);

  // Keep grid/facet work off the typing critical path.
  const deferredFilters = useDeferredValue(filters);
  const deferredSort = useDeferredValue(sort);
  const filtersPending = deferredFilters !== filters;

  // Hydrate personal density prefs after mount (avoid SSR localStorage mismatch).
  useEffect(() => {
    setAppearance(readAppearance());
    setAppearanceReady(true);
  }, []);

  useEffect(() => {
    if (!appearanceReady) return;
    writeAppearance(appearance);
  }, [appearance, appearanceReady]);

  // Restore selection + open create form after login?next= round-trip.
  useEffect(() => {
    const pendingIds = takeShowreelCreatePending();
    if (!pendingIds) return;
    const known = new Set(entries.map((entry) => entry._id));
    const restored = pendingIds.filter((id) => known.has(id));
    if (restored.length === 0) return;
    setSelectedIds(new Set(restored));
    setCreateOpen(true);
  }, [entries]);

  useEffect(() => {
    replaceLibraryUrl({ filters, sort, view });
  }, [filters, sort, view]);

  // Browser back/forward: re-read the query string we mirrored above.
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      setFilters(readFilters(params));
      setSort(readSort(params));
      setView(readView(params));
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const artDirectorOptions = useMemo(
    () => buildArtDirectorFilterOptions(entries),
    [entries],
  );
  const directorOptions = useMemo(
    () => buildDirectorFilterOptions(entries),
    [entries],
  );
  const dopOptions = useMemo(
    () => buildDopFilterOptions(entries),
    [entries],
  );
  const clientOptions = useMemo(
    () => buildClientFilterOptions(entries),
    [entries],
  );
  const editorOptions = useMemo(
    () => buildEditorFilterOptions(entries),
    [entries],
  );

  const filterCtx = useMemo(() => {
    const nameByFilterId = new Map<string, string>();
    for (const map of [
      identityNameById(clientOptions),
      identityNameById(directorOptions),
      identityNameById(dopOptions),
      identityNameById(artDirectorOptions),
      identityNameById(editorOptions),
    ]) {
      for (const [id, name] of map) nameByFilterId.set(id, name);
    }
    return {
      nameByFilterId,
      searchTextByEntryId: buildSearchTextByEntryId(entries),
    };
  }, [
    artDirectorOptions,
    clientOptions,
    directorOptions,
    dopOptions,
    editorOptions,
    entries,
  ]);

  const filteredSorted = useMemo(() => {
    return sortLibraryEntries(
      filterLibraryEntries(entries, deferredFilters, filterCtx),
      deferredSort,
      locale,
    );
  }, [entries, deferredFilters, filterCtx, deferredSort, locale]);

  const visibilityTotal = useMemo(() => {
    if (deferredFilters.visibility === 'all') return entries.length;
    if (deferredFilters.visibility === 'hidden') {
      return entries.filter((entry) => entry.isHidden).length;
    }
    return entries.filter((entry) => !entry.isHidden).length;
  }, [entries, deferredFilters.visibility]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSort(DEFAULT_SORT);
  }, []);

  const toggleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setCreateOpen(false);
  }, []);

  const selectedIdList = useMemo(() => [...selectedIds], [selectedIds]);

  return (
    <div className="vp-internal-app" {...appearanceDataAttrs(appearance)}>
      <header className="vp-internal-app__header">
        <h1 className="vp-internal-app__title">Work Library</h1>
      </header>

      <WorkInternalToolbar
        entries={entries}
        filters={filters}
        deferredFilters={deferredFilters}
        sort={sort}
        view={view}
        appearance={appearance}
        resultCount={filteredSorted.length}
        totalCount={visibilityTotal}
        filtersPending={filtersPending}
        clients={clientOptions}
        directors={directorOptions}
        dops={dopOptions}
        artDirectors={artDirectorOptions}
        editors={editorOptions}
        filterCtx={filterCtx}
        videoFormats={videoFormats}
        industries={industries}
        markets={markets}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        onViewChange={setView}
        onAppearanceChange={setAppearance}
        onClear={clearFilters}
      />

      <div
        className="vp-internal-app__body"
        style={filtersPending ? {opacity: 0.72} : undefined}
      >
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
              locale={locale}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          ) : (
            <WorkInternalCardView
              entries={filteredSorted}
              locale={locale}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          )}
        </div>
      </div>

      <WorkInternalShowreelBar
        selectedIds={selectedIdList}
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
        onClearSelection={clearSelection}
      />
    </div>
  );
}
