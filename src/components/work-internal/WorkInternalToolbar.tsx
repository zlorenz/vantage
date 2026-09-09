/**
 * WorkInternalToolbar — search, chip filters, sort, view toggle, clear, count.
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
import type {LibraryAppearance} from './appearance';
import {
  countFacetOptions,
  type LibraryFilterContext,
} from './filter-entries';
import {hasActiveFilters} from './url-state';
import type {LibraryFilters, LibrarySort, LibraryViewMode} from './types';
import {WorkInternalAppearancePanel} from './WorkInternalAppearancePanel';
import {
  FilterActivePill,
  FilterOptionList,
  WorkInternalFilterPanel,
  type FilterPanelOption,
} from './WorkInternalFilterPanel';

type ChipPanelId = 'taxonomy' | 'client';

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
  appearance: LibraryAppearance;
  resultCount: number;
  totalCount: number;
  filtersPending?: boolean;
  clients: CreditIdentityTerm[];
  directors: CreditIdentityTerm[];
  dops: CreditIdentityTerm[];
  artDirectors: CreditIdentityTerm[];
  editors: CreditIdentityTerm[];
  videoFormats: TaxonomyTerm[];
  industries: TaxonomyTerm[];
  markets: TaxonomyTerm[];
  filterCtx?: LibraryFilterContext;
  onFiltersChange: (next: LibraryFilters) => void;
  onSortChange: (sort: LibrarySort) => void;
  onViewChange: (view: LibraryViewMode) => void;
  onAppearanceChange: (next: LibraryAppearance) => void;
  onClear: () => void;
}

function optionCountLabel(count: number, label: string): string {
  return count > 0 ? `${label} (${count})` : label;
}

function identityOptionsWithCounts(
  terms: CreditIdentityTerm[],
  counts: Map<string, number>,
  selectedId: string,
): {value: string; label: string; disabled: boolean}[] {
  return terms.map((term) => {
    const count = counts.get(term._id) ?? 0;
    return {
      value: term._id,
      label: optionCountLabel(count, decodeHtmlEntities(term.name)),
      disabled: count === 0 && selectedId !== term._id,
    };
  });
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

function toClientPanelOptions(
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

function findClientLabel(terms: CreditIdentityTerm[], id: string): string {
  const hit = terms.find((t) => t._id === id);
  return hit ? decodeHtmlEntities(hit.name) : id;
}

export function WorkInternalToolbar({
  entries,
  filters,
  deferredFilters,
  sort,
  view,
  appearance,
  resultCount,
  totalCount,
  filtersPending = false,
  clients,
  directors,
  dops,
  artDirectors,
  editors,
  videoFormats,
  industries,
  markets,
  filterCtx,
  onFiltersChange,
  onSortChange,
  onViewChange,
  onAppearanceChange,
  onClear,
}: WorkInternalToolbarProps) {
  const active = hasActiveFilters(filters);
  const [openPanel, setOpenPanel] = useState<ChipPanelId | null>(null);
  const [clientQuery, setClientQuery] = useState('');
  const [taxonomyTab, setTaxonomyTab] =
    useState<TaxonomyFilterKey>('format');
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
      deferredFilters.format,
      deferredFilters.industry,
      deferredFilters.market,
      deferredFilters.visibility,
    ],
  );

  const directorSelectOptions = useMemo(() => {
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'director',
      directors.map((c) => c._id),
      filterCtx,
    );
    return identityOptionsWithCounts(directors, counts, facetFilters.director);
  }, [entries, facetFilters, directors, filterCtx]);

  const dopSelectOptions = useMemo(() => {
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'dop',
      dops.map((c) => c._id),
      filterCtx,
    );
    return identityOptionsWithCounts(dops, counts, facetFilters.dop);
  }, [entries, facetFilters, dops, filterCtx]);

  const artDirectorSelectOptions = useMemo(() => {
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'art-director',
      artDirectors.map((c) => c._id),
      filterCtx,
    );
    return identityOptionsWithCounts(
      artDirectors,
      counts,
      facetFilters['art-director'],
    );
  }, [entries, facetFilters, artDirectors, filterCtx]);

  const editorSelectOptions = useMemo(() => {
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'editor',
      editors.map((c) => c._id),
      filterCtx,
    );
    return identityOptionsWithCounts(editors, counts, facetFilters.editor);
  }, [entries, facetFilters, editors, filterCtx]);

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
    return toClientPanelOptions(clients, counts, facetFilters.client);
  }, [entries, facetFilters, clients, filterCtx]);

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

  const filteredClientOptions = useMemo(() => {
    const needle = clientQuery.trim().toLowerCase();
    if (!needle) return clientOptions;
    return clientOptions.filter((opt) =>
      opt.label.toLowerCase().includes(needle),
    );
  }, [clientOptions, clientQuery]);

  const activePills = useMemo(() => {
    const pills: {key: string; filterKey: 'client' | TaxonomyFilterKey; label: string}[] =
      [];

    if (filters.client) {
      pills.push({
        key: 'client',
        filterKey: 'client',
        label: `Client: ${findClientLabel(clients, filters.client)}`,
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

    return pills;
  }, [
    filters.client,
    filters.format,
    filters.industry,
    filters.market,
    clients,
    videoFormats,
    industries,
    markets,
  ]);

  return (
    <div className="vp-internal-toolbar">
      <div className="vp-internal-toolbar__row vp-internal-toolbar__row--primary">
        <label className="vp-internal-search">
          <span className="sr-only">Search library</span>
          <input
            type="search"
            className="vp-internal-search__input"
            placeholder="Search title, client, crew…"
            value={filters.q}
            onChange={(e) => patchFilter('q', e.target.value)}
          />
        </label>

        <div className="vp-internal-toolbar__meta">
          <span
            className="vp-internal-count"
            aria-live="polite"
            aria-busy={filtersPending || undefined}
          >
            {resultCount === totalCount
              ? `${resultCount} projects`
              : `${resultCount} of ${totalCount}`}
          </span>

          {active ? (
            <button
              type="button"
              className="vp-internal-clear"
              onClick={onClear}
            >
              Clear filters
            </button>
          ) : null}

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

          <div className="vp-internal-toolbar__view-group">
            <div
              className="vp-internal-view-toggle"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                className={
                  view === 'cards'
                    ? 'vp-internal-view-toggle__btn is-active'
                    : 'vp-internal-view-toggle__btn'
                }
                aria-pressed={view === 'cards'}
                onClick={() => onViewChange('cards')}
              >
                Cards
              </button>
              <button
                type="button"
                className={
                  view === 'list'
                    ? 'vp-internal-view-toggle__btn is-active'
                    : 'vp-internal-view-toggle__btn'
                }
                aria-pressed={view === 'list'}
                onClick={() => onViewChange('list')}
              >
                List
              </button>
            </div>
            <div className="vp-internal-view-toggle">
              <WorkInternalAppearancePanel
                appearance={appearance}
                onChange={onAppearanceChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="vp-internal-toolbar__row vp-internal-toolbar__row--filters">
        <div className="vp-internal-fchips" ref={chipRowRef}>
          <WorkInternalFilterPanel
            label="Taxonomy"
            activeCount={taxonomyActiveCount}
            open={openPanel === 'taxonomy'}
            onToggle={() => togglePanel('taxonomy')}
            panelClassName="vp-internal-fchip__panel--taxonomy"
          >
            <div className="vp-internal-ftax">
              <div
                className="vp-internal-ftax__tabs"
                role="tablist"
                aria-label="Taxonomy group"
              >
                {TAXONOMY_SECTIONS.map((section) => {
                  const selected = Boolean(filters[section.key]);
                  return (
                    <button
                      key={section.key}
                      type="button"
                      role="tab"
                      aria-selected={taxonomyTab === section.key}
                      className={
                        taxonomyTab === section.key
                          ? 'vp-internal-ftax__tab is-active'
                          : 'vp-internal-ftax__tab'
                      }
                      onClick={() => setTaxonomyTab(section.key)}
                    >
                      {section.label}
                      {selected ? (
                        <span className="vp-internal-ftax__tab-dot" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {TAXONOMY_SECTIONS.map((section) =>
                taxonomyTab === section.key ? (
                  <div
                    key={section.key}
                    role="tabpanel"
                    aria-label={section.label}
                    className="vp-internal-ftax__panel"
                  >
                    <FilterOptionList
                      options={taxonomyOptionsByKey[section.key]}
                      selectedValue={filters[section.key]}
                      onSelect={(value) => patchFilter(section.key, value)}
                    />
                  </div>
                ) : null,
              )}
            </div>
          </WorkInternalFilterPanel>

          <WorkInternalFilterPanel
            label="Client"
            activeCount={filters.client ? 1 : 0}
            open={openPanel === 'client'}
            onToggle={() => togglePanel('client')}
            panelClassName="vp-internal-fchip__panel--client"
          >
            <label className="vp-internal-fchip__search">
              <span className="sr-only">Search clients</span>
              <input
                type="search"
                className="vp-internal-fchip__search-input"
                placeholder="Search clients…"
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
                clientQuery.trim() ? 'No matching clients' : 'No clients'
              }
            />
          </WorkInternalFilterPanel>
        </div>

        {/* People role selects — replaced in the next prompt */}
        <FilterSelect
          label="Director"
          value={filters.director}
          onChange={(v) => patchFilter('director', v)}
          options={directorSelectOptions}
        />
        <FilterSelect
          label="DOP"
          value={filters.dop}
          onChange={(v) => patchFilter('dop', v)}
          options={dopSelectOptions}
        />
        <FilterSelect
          label="Art Director"
          value={filters['art-director']}
          onChange={(v) => patchFilter('art-director', v)}
          options={artDirectorSelectOptions}
        />
        <FilterSelect
          label="Editor"
          value={filters.editor}
          onChange={(v) => patchFilter('editor', v)}
          options={editorSelectOptions}
        />

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
            <option value="client-asc">Client A–Z</option>
          </select>
        </label>
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

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {value: string; label: string; disabled: boolean}[];
  includeAll?: boolean;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  includeAll = true,
}: FilterSelectProps) {
  return (
    <label className="vp-internal-filter">
      <span className="vp-internal-filter__label">{label}</span>
      <select
        className="vp-internal-filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {includeAll ? <option value="">All</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
