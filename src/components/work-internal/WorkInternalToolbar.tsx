/**
 * WorkInternalToolbar — chip filters, sort, view toggle, clear, count.
 * Library search lives in WorkInternalNav (page header).
 */

'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {decodeHtmlEntities} from '@/lib/decode-html-entities';
import {flattenTaxonomyTree} from '@/lib/taxonomy-tree';
import type {
  CreditIdentityTerm,
  InternalLibraryEntry,
  TaxonomyTerm,
} from '@/types/sanity';
import {
  countFacetOptions,
  type LibraryFilterContext,
} from './filter-entries';
import {
  PEOPLE_FILTER_GROUPS,
  PEOPLE_LIBRARY_FILTER_KEYS,
  type PeopleLibraryFilterKey,
} from './people-filters';
import {hasActiveFilters} from './url-state';
import type {LibraryFilters, LibrarySort, LibraryViewMode} from './types';
import {NestedFilterMenu} from './NestedFilterMenu';
import {
  FilterActivePill,
  FilterOptionList,
  WorkInternalFilterPanel,
  type FilterPanelOption,
} from './WorkInternalFilterPanel';

type ChipPanelId = 'taxonomy' | 'client' | 'people';

type TaxonomyFilterKey = 'format' | 'industry' | 'market';

const TAXONOMY_SECTIONS: {
  key: TaxonomyFilterKey;
  label: string;
}[] = [
  {key: 'format', label: 'Format'},
  {key: 'industry', label: 'Industry'},
  {key: 'market', label: 'Market'},
];

interface WorkInternalToolbarProps {
  entries: InternalLibraryEntry[];
  /** Immediate filters (drives controlled inputs). */
  filters: LibraryFilters;
  /** Deferred filters used for expensive facet counts. */
  deferredFilters: LibraryFilters;
  sort: LibrarySort;
  view: LibraryViewMode;
  resultCount: number;
  totalCount: number;
  filtersPending?: boolean;
  clients: CreditIdentityTerm[];
  peopleOptionsByKey: Record<PeopleLibraryFilterKey, CreditIdentityTerm[]>;
  videoFormats: TaxonomyTerm[];
  industries: TaxonomyTerm[];
  markets: TaxonomyTerm[];
  filterCtx?: LibraryFilterContext;
  onFiltersChange: (next: LibraryFilters) => void;
  onSortChange: (sort: LibrarySort) => void;
  onViewChange: (view: LibraryViewMode) => void;
  onClear: () => void;
}

function toTaxonomyPanelOptions(
  terms: TaxonomyTerm[],
  counts: Map<string, number>,
  selectedSlug: string,
): FilterPanelOption[] {
  return flattenTaxonomyTree(terms).map(({term, depth}) => {
    const count = counts.get(term.slug) ?? 0;
    return {
      value: term.slug,
      label: decodeHtmlEntities(term.title),
      depth,
      count,
      disabled: count === 0 && selectedSlug !== term.slug,
    };
  });
}

function toIdentityPanelOptions(
  terms: CreditIdentityTerm[],
  counts: Map<string, number>,
  selectedId: string,
): FilterPanelOption[] {
  return terms.map((term) => {
    const count = counts.get(term._id) ?? 0;
    return {
      value: term._id,
      label: decodeHtmlEntities(term.name),
      count,
      disabled: count === 0 && selectedId !== term._id,
    };
  });
}

function findTaxonomyLabel(terms: TaxonomyTerm[], slug: string): string {
  const hit = terms.find((t) => t.slug === slug || t.slugZh === slug);
  return hit ? decodeHtmlEntities(hit.title) : slug;
}

function findIdentityLabel(terms: CreditIdentityTerm[], id: string): string {
  const hit = terms.find((t) => t._id === id);
  return hit ? decodeHtmlEntities(hit.name) : id;
}

export function WorkInternalToolbar({
  entries,
  filters,
  deferredFilters,
  sort,
  view,
  resultCount,
  totalCount,
  filtersPending = false,
  clients,
  peopleOptionsByKey,
  videoFormats,
  industries,
  markets,
  filterCtx,
  onFiltersChange,
  onSortChange,
  onViewChange,
  onClear,
}: WorkInternalToolbarProps) {
  const active = hasActiveFilters(filters);
  const [openPanel, setOpenPanel] = useState<ChipPanelId | null>(null);
  const [clientQuery, setClientQuery] = useState('');
  const chipRowRef = useRef<HTMLDivElement>(null);

  function patchFilter<K extends keyof LibraryFilters>(
    key: K,
    value: LibraryFilters[K],
  ) {
    onFiltersChange({...filters, [key]: value});
  }

  function togglePanel(id: ChipPanelId) {
    setOpenPanel((prev) => (prev === id ? null : id));
  }

  useEffect(() => {
    if (!openPanel) return;

    function onPointerDown(event: PointerEvent) {
      const root = chipRowRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setOpenPanel(null);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenPanel(null);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openPanel]);

  useEffect(() => {
    if (openPanel !== 'client') setClientQuery('');
  }, [openPanel]);

  // Facet counts ignore free-text search so typing never re-scores every
  // dropdown option. Dropdown/visibility changes still update counts.
  const facetFilters = useMemo(
    (): LibraryFilters => ({...deferredFilters, q: ''}),
    [
      deferredFilters.client,
      deferredFilters.director,
      deferredFilters.dop,
      deferredFilters['art-director'],
      deferredFilters.editor,
      deferredFilters.producer,
      deferredFilters['line-producer'],
      deferredFilters.colorist,
      deferredFilters['sound-design-mix'],
      deferredFilters.composer,
      deferredFilters['1st-ad'],
      deferredFilters['vfx-online'],
      deferredFilters.format,
      deferredFilters.industry,
      deferredFilters.market,
      deferredFilters.visibility,
    ],
  );

  const formatOptions = useMemo(() => {
    const flat = flattenTaxonomyTree(videoFormats);
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'format',
      flat.map(({term}) => term.slug),
      filterCtx,
    );
    return toTaxonomyPanelOptions(videoFormats, counts, facetFilters.format);
  }, [entries, facetFilters, videoFormats, filterCtx]);

  const industryOptions = useMemo(() => {
    const flat = flattenTaxonomyTree(industries);
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'industry',
      flat.map(({term}) => term.slug),
      filterCtx,
    );
    return toTaxonomyPanelOptions(industries, counts, facetFilters.industry);
  }, [entries, facetFilters, industries, filterCtx]);

  const marketOptions = useMemo(() => {
    const flat = flattenTaxonomyTree(markets);
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'market',
      flat.map(({term}) => term.slug),
      filterCtx,
    );
    return toTaxonomyPanelOptions(markets, counts, facetFilters.market);
  }, [entries, facetFilters, markets, filterCtx]);

  const clientOptions = useMemo(() => {
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'client',
      clients.map((c) => c._id),
      filterCtx,
    );
    return toIdentityPanelOptions(clients, counts, facetFilters.client);
  }, [entries, facetFilters, clients, filterCtx]);

  const peopleOptionsByGroup = useMemo(() => {
    return PEOPLE_FILTER_GROUPS.map((group) => {
      const terms = peopleOptionsByKey[group.libraryKey];
      const counts = countFacetOptions(
        entries,
        facetFilters,
        group.libraryKey,
        terms.map((t) => t._id),
        filterCtx,
      );
      return {
        group,
        options: toIdentityPanelOptions(
          terms,
          counts,
          facetFilters[group.libraryKey],
        ),
      };
    });
  }, [entries, facetFilters, peopleOptionsByKey, filterCtx]);

  const taxonomyOptionsByKey: Record<TaxonomyFilterKey, FilterPanelOption[]> =
    {
      format: formatOptions,
      industry: industryOptions,
      market: marketOptions,
    };

  const taxonomyTermsByKey: Record<TaxonomyFilterKey, TaxonomyTerm[]> = {
    format: videoFormats,
    industry: industries,
    market: markets,
  };

  const taxonomyActiveCount = TAXONOMY_SECTIONS.filter(
    ({key}) => Boolean(filters[key]),
  ).length;

  const peopleActiveCount = PEOPLE_LIBRARY_FILTER_KEYS.filter((key) =>
    Boolean(filters[key]),
  ).length;

  const filteredClientOptions = useMemo(() => {
    const needle = clientQuery.trim().toLowerCase();
    if (!needle) return clientOptions;
    return clientOptions.filter((opt) =>
      opt.label.toLowerCase().includes(needle),
    );
  }, [clientOptions, clientQuery]);

  const categorySections = useMemo(
    () =>
      TAXONOMY_SECTIONS.map((section) => ({
        id: section.key,
        label: section.label,
        hasSelection: Boolean(filters[section.key]),
        options: taxonomyOptionsByKey[section.key],
        selectedValue: filters[section.key],
        onSelect: (value: string) => patchFilter(section.key, value),
        emptyLabel: `No ${section.label.toLowerCase()} terms`,
      })),
    [
      filters.format,
      filters.industry,
      filters.market,
      formatOptions,
      industryOptions,
      marketOptions,
    ],
  );

  const crewSections = useMemo(
    () =>
      peopleOptionsByGroup.map(({group, options}) => ({
        id: group.libraryKey,
        label: group.label,
        hasSelection: Boolean(filters[group.libraryKey]),
        options,
        selectedValue: filters[group.libraryKey],
        onSelect: (value: string) => patchFilter(group.libraryKey, value),
        searchPlaceholder: `Search ${group.label.toLowerCase()}…`,
        emptyLabel: 'No people credited',
      })),
    [peopleOptionsByGroup, filters],
  );

  const activePills = useMemo(() => {
    const pills: {
      key: string;
      filterKey: 'client' | TaxonomyFilterKey | PeopleLibraryFilterKey;
      label: string;
    }[] = [];

    if (filters.client) {
      pills.push({
        key: 'client',
        filterKey: 'client',
        label: `Brand: ${findIdentityLabel(clients, filters.client)}`,
      });
    }

    for (const section of TAXONOMY_SECTIONS) {
      const value = filters[section.key];
      if (!value) continue;
      pills.push({
        key: section.key,
        filterKey: section.key,
        label: `${section.label}: ${findTaxonomyLabel(
          taxonomyTermsByKey[section.key],
          value,
        )}`,
      });
    }

    for (const group of PEOPLE_FILTER_GROUPS) {
      const value = filters[group.libraryKey];
      if (!value) continue;
      pills.push({
        key: group.libraryKey,
        filterKey: group.libraryKey,
        label: `${group.label}: ${findIdentityLabel(
          peopleOptionsByKey[group.libraryKey],
          value,
        )}`,
      });
    }

    return pills;
  }, [
    filters.client,
    filters.format,
    filters.industry,
    filters.market,
    filters.director,
    filters.dop,
    filters['art-director'],
    filters.editor,
    filters.producer,
    filters['line-producer'],
    filters.colorist,
    filters['sound-design-mix'],
    filters.composer,
    filters['1st-ad'],
    filters['vfx-online'],
    clients,
    peopleOptionsByKey,
    videoFormats,
    industries,
    markets,
  ]);

  return (
    <div className="vp-internal-toolbar">
      <div className="vp-internal-toolbar__row vp-internal-toolbar__row--filters">
        <div className="vp-internal-fchips" ref={chipRowRef}>
          <div
            className="vp-internal-view-toggle"
            role="group"
            aria-label="View mode"
          >
              <button
                type="button"
                className={
                  view === 'cards'
                    ? 'vp-internal-view-toggle__btn vp-internal-view-toggle__btn--icon is-active'
                    : 'vp-internal-view-toggle__btn vp-internal-view-toggle__btn--icon'
                }
                aria-label="Cards"
                aria-pressed={view === 'cards'}
                onClick={() => onViewChange('cards')}
              >
                <svg
                  className="vp-internal-view-toggle__icon"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  focusable="false"
                >
                  <rect x="1" y="1" width="4" height="4" rx="0.5" fill="currentColor" />
                  <rect x="6" y="1" width="4" height="4" rx="0.5" fill="currentColor" />
                  <rect x="11" y="1" width="4" height="4" rx="0.5" fill="currentColor" />
                  <rect x="1" y="6" width="4" height="4" rx="0.5" fill="currentColor" />
                  <rect x="6" y="6" width="4" height="4" rx="0.5" fill="currentColor" />
                  <rect x="11" y="6" width="4" height="4" rx="0.5" fill="currentColor" />
                  <rect x="1" y="11" width="4" height="4" rx="0.5" fill="currentColor" />
                  <rect x="6" y="11" width="4" height="4" rx="0.5" fill="currentColor" />
                  <rect x="11" y="11" width="4" height="4" rx="0.5" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                className={
                  view === 'list'
                    ? 'vp-internal-view-toggle__btn vp-internal-view-toggle__btn--icon is-active'
                    : 'vp-internal-view-toggle__btn vp-internal-view-toggle__btn--icon'
                }
                aria-label="List"
                aria-pressed={view === 'list'}
                onClick={() => onViewChange('list')}
              >
                <svg
                  className="vp-internal-view-toggle__icon"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="2.5" cy="3" r="1.25" fill="currentColor" />
                  <rect x="5.5" y="2" width="9" height="2" rx="0.75" fill="currentColor" />
                  <circle cx="2.5" cy="8" r="1.25" fill="currentColor" />
                  <rect x="5.5" y="7" width="9" height="2" rx="0.75" fill="currentColor" />
                  <circle cx="2.5" cy="13" r="1.25" fill="currentColor" />
                  <rect x="5.5" y="12" width="9" height="2" rx="0.75" fill="currentColor" />
                </svg>
              </button>
            </div>

            <div
              className="vp-internal-view-toggle"
              role="group"
              aria-label="Visibility"
            >
              <button
                type="button"
                className={
                  filters.visibility === 'all'
                    ? 'vp-internal-view-toggle__btn is-active'
                    : 'vp-internal-view-toggle__btn'
                }
                aria-pressed={filters.visibility === 'all'}
                onClick={() => patchFilter('visibility', 'all')}
              >
                All
              </button>
              <button
                type="button"
                className={
                  filters.visibility === 'public'
                    ? 'vp-internal-view-toggle__btn is-active'
                    : 'vp-internal-view-toggle__btn'
                }
                aria-pressed={filters.visibility === 'public'}
                onClick={() => patchFilter('visibility', 'public')}
              >
                Public
              </button>
              <button
                type="button"
                className={
                  filters.visibility === 'hidden'
                    ? 'vp-internal-view-toggle__btn is-active'
                    : 'vp-internal-view-toggle__btn'
                }
                aria-pressed={filters.visibility === 'hidden'}
                onClick={() => patchFilter('visibility', 'hidden')}
              >
                Hidden
              </button>
            </div>

            <WorkInternalFilterPanel
              label="Categories"
              activeCount={taxonomyActiveCount}
              open={openPanel === 'taxonomy'}
              onToggle={() => togglePanel('taxonomy')}
              panelClassName="vp-internal-fchip__panel--nested"
            >
              <NestedFilterMenu
                rootLabel="Categories"
                sections={categorySections}
              />
            </WorkInternalFilterPanel>

            <WorkInternalFilterPanel
              label="Brands"
              activeCount={filters.client ? 1 : 0}
              open={openPanel === 'client'}
              onToggle={() => togglePanel('client')}
              panelClassName="vp-internal-fchip__panel--client"
            >
              <label className="vp-internal-fchip__search">
                <span className="sr-only">Search brands</span>
                <input
                  type="search"
                  className="vp-internal-fchip__search-input"
                  placeholder="Search brands…"
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                />
              </label>
              <FilterOptionList
                options={filteredClientOptions}
                selectedValue={filters.client}
                onSelect={(value) => {
                  patchFilter('client', value);
                  if (value) setOpenPanel(null);
                }}
                emptyLabel={
                  clientQuery.trim() ? 'No matching brands' : 'No brands'
                }
              />
            </WorkInternalFilterPanel>

            <WorkInternalFilterPanel
              label="Crew"
              activeCount={peopleActiveCount}
              open={openPanel === 'people'}
              onToggle={() => togglePanel('people')}
              panelClassName="vp-internal-fchip__panel--nested"
            >
              <NestedFilterMenu rootLabel="Crew roles" sections={crewSections} />
            </WorkInternalFilterPanel>
          </div>

          <label className="vp-internal-filter">
            <span className="vp-internal-filter__label">Sort</span>
            <select
              className="vp-internal-filter__select"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as LibrarySort)}
            >
              <option value="publishedAt-desc">Newest first</option>
              <option value="publishedAt-asc">Oldest first</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
              <option value="client-asc">Brand A–Z</option>
              <option value="client-desc">Brand Z–A</option>
            </select>
          </label>

          <div className="vp-internal-toolbar__meta">
            {active ? (
              <button
                type="button"
                className="vp-internal-clear"
                onClick={onClear}
              >
                Clear filters
              </button>
            ) : null}
            <span
              className="vp-internal-count"
              aria-live="polite"
              aria-busy={filtersPending || undefined}
            >
              {resultCount === totalCount
                ? `${resultCount} projects`
                : `${resultCount} of ${totalCount}`}
            </span>
          </div>
      </div>

      {activePills.length > 0 ? (
        <div
          className="vp-internal-toolbar__row vp-internal-toolbar__row--pills"
          aria-label="Active filters"
        >
          {activePills.map((pill) => (
            <FilterActivePill
              key={pill.key}
              label={pill.label}
              onRemove={() => patchFilter(pill.filterKey, '')}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
