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
  useRef,
  useState,
} from 'react';
// useDeferredValue also drives search suggestions so the dropdown never
// blocks keystrokes (same pattern as deferred grid filtering).
import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/i18n/routing';
import type {
  InternalLibraryEntry,
  TaxonomyTerm,
} from '@/types/sanity';
import {
  buildAllPeopleFilterOptions,
  buildClientFilterOptions,
  buildSearchTextByEntryId,
  filterLibraryEntries,
  identityNameById,
} from './filter-entries';
import {PEOPLE_FILTER_GROUPS} from './people-filters';
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
import {
  buildSearchSuggestionIndex,
  getSearchSuggestions,
} from './search-suggestions';
import { takeShowreelCreatePending } from './showreel-create-pending';
import { WorkInternalCardView } from './WorkInternalCardView';
import { WorkInternalListView } from './WorkInternalListView';
import { WorkInternalNav } from './WorkInternalNav';
import { WorkInternalShowreelBar } from './WorkInternalShowreelBar';
import { WorkInternalToolbar } from './WorkInternalToolbar';

export interface WorkInternalAppProps {
  locale: Locale;
  entries: InternalLibraryEntry[];
  videoFormats: TaxonomyTerm[];
  industries: TaxonomyTerm[];
  markets: TaxonomyTerm[];
  /** When true, detail links use app-host paths (`/{slug}`). */
  onAppHost?: boolean;
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
  onAppHost = false,
}: WorkInternalAppProps) {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() => readFilters(searchParams));
  const [sort, setSort] = useState(() => readSort(searchParams));
  const [view, setView] = useState(() => readView(searchParams));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  /** Anchor for shift-click range select over the visible (filtered) list. */
  const selectAnchorIdRef = useRef<string | null>(null);

  // Keep grid/facet work off the typing critical path.
  const deferredFilters = useDeferredValue(filters);
  const deferredSort = useDeferredValue(sort);
  const filtersPending = deferredFilters !== filters;
  // Suggestions track a deferred query so ranking stays off keystrokes.
  const deferredSearchQuery = useDeferredValue(filters.q);

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

  const clientOptions = useMemo(
    () => buildClientFilterOptions(entries),
    [entries],
  );
  const peopleOptionsByKey = useMemo(
    () => buildAllPeopleFilterOptions(entries),
    [entries],
  );

  const filterCtx = useMemo(() => {
    const nameByFilterId = new Map<string, string>();
    for (const [id, name] of identityNameById(clientOptions)) {
      nameByFilterId.set(id, name);
    }
    for (const group of PEOPLE_FILTER_GROUPS) {
      for (const [id, name] of identityNameById(
        peopleOptionsByKey[group.libraryKey],
      )) {
        nameByFilterId.set(id, name);
      }
    }
    return {
      nameByFilterId,
      searchTextByEntryId: buildSearchTextByEntryId(entries),
    };
  }, [clientOptions, peopleOptionsByKey, entries]);

  const searchSuggestionIndex = useMemo(
    () => buildSearchSuggestionIndex(entries),
    [entries],
  );

  const searchSuggestions = useMemo(
    () => getSearchSuggestions(searchSuggestionIndex, deferredSearchQuery),
    [searchSuggestionIndex, deferredSearchQuery],
  );

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

  // Visible order drives range select — drop the anchor when it changes.
  useEffect(() => {
    selectAnchorIdRef.current = null;
  }, [deferredFilters, deferredSort, locale]);

  const toggleSelect = useCallback(
    (id: string, selected: boolean, shiftKey = false) => {
      const visibleIds = filteredSorted.map((entry) => entry._id);
      const anchorId = selectAnchorIdRef.current;

      if (shiftKey && anchorId) {
        const from = visibleIds.indexOf(anchorId);
        const to = visibleIds.indexOf(id);
        if (from >= 0 && to >= 0) {
          const start = Math.min(from, to);
          const end = Math.max(from, to);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            for (let i = start; i <= end; i++) {
              const itemId = visibleIds[i]!;
              if (selected) next.add(itemId);
              else next.delete(itemId);
            }
            return next;
          });
          return;
        }
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) next.add(id);
        else next.delete(id);
        return next;
      });
      selectAnchorIdRef.current = id;
    },
    [filteredSorted],
  );

  const allVisibleSelected =
    filteredSorted.length > 0 &&
    filteredSorted.every((entry) => selectedIds.has(entry._id));

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(filteredSorted.map((entry) => entry._id)));
  }, [filteredSorted]);

  const deselectVisible = useCallback(() => {
    const visible = new Set(filteredSorted.map((entry) => entry._id));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (!visible.has(id)) next.add(id);
      }
      return next;
    });
    selectAnchorIdRef.current = null;
  }, [filteredSorted]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setCreateOpen(false);
    selectAnchorIdRef.current = null;
  }, []);

  const selectedIdList = useMemo(() => [...selectedIds], [selectedIds]);

  return (
    <div className="vp-internal-app">
      <WorkInternalNav
        searchQuery={filters.q}
        onSearchChange={(q) => setFilters((prev) => ({...prev, q}))}
        suggestions={searchSuggestions}
      />

      <WorkInternalToolbar
        entries={entries}
        filters={filters}
        deferredFilters={deferredFilters}
        sort={sort}
        view={view}
        resultCount={filteredSorted.length}
        totalCount={visibilityTotal}
        filtersPending={filtersPending}
        clients={clientOptions}
        peopleOptionsByKey={peopleOptionsByKey}
        filterCtx={filterCtx}
        videoFormats={videoFormats}
        industries={industries}
        markets={markets}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        onViewChange={setView}
        onClear={clearFilters}
        allVisibleSelected={allVisibleSelected}
        onSelectAllVisible={selectAllVisible}
        onDeselectVisible={deselectVisible}
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
              sort={sort}
              onSortChange={setSort}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              allVisibleSelected={allVisibleSelected}
              onToggleSelectAllVisible={() => {
                if (allVisibleSelected) deselectVisible();
                else selectAllVisible();
              }}
              onAppHost={onAppHost}
            />
          ) : (
            <WorkInternalCardView
              entries={filteredSorted}
              locale={locale}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onAppHost={onAppHost}
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
