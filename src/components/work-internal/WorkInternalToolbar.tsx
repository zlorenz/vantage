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
import type {CardSize, LibraryAppearance} from './appearance';
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
  appearance: LibraryAppearance;
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
  onAppearanceChange: (next: LibraryAppearance) => void;
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
  appearance,
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
  onAppearanceChange,
  onClear,
}: WorkInternalToolbarProps) {
  const active = hasActiveFilters(filters);
  const [openPanel, setOpenPanel] = useState<ChipPanelId | null>(null);
  const [clientQuery, setClientQuery] = useState('');
  const [peopleQuery, setPeopleQuery] = useState('');
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
    if (openPanel !== 'people') setPeopleQuery('');
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

  const filteredPeopleGroups = useMemo(() => {
    const needle = peopleQuery.trim().toLowerCase();
    if (!needle) return peopleOptionsByGroup;
    return peopleOptionsByGroup
      .map(({group, options}) => ({
        group,
        options: options.filter((opt) =>
          opt.label.toLowerCase().includes(needle),
        ),
      }))
      .filter(({options}) => options.length > 0);
  }, [peopleOptionsByGroup, peopleQuery]);

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
        label: `Client: ${findIdentityLabel(clients, filters.client)}`,
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
      <div className="vp-internal-toolbar__row vp-internal-toolbar__row--primary">
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

            <div className="vp-internal-card-size">
              <span className="vp-internal-card-size__label">Card Size</span>
              <div
                className="vp-internal-view-toggle"
                role="group"
                aria-label="Card size"
              >
                {(['s', 'm', 'l'] as const).map((size: CardSize) => (
                  <button
                    key={size}
                    type="button"
                    className={
                      appearance.cardSize === size
                        ? 'vp-internal-view-toggle__btn is-active'
                        : 'vp-internal-view-toggle__btn'
                    }
                    aria-pressed={appearance.cardSize === size}
                    onClick={() =>
                      onAppearanceChange({...appearance, cardSize: size})
                    }
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
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
                        <span
                          className="vp-internal-ftax__tab-dot"
                          aria-hidden="true"
                        />
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

          <WorkInternalFilterPanel
            label="People"
            activeCount={peopleActiveCount}
            open={openPanel === 'people'}
            onToggle={() => togglePanel('people')}
            panelClassName="vp-internal-fchip__panel--people"
          >
            <label className="vp-internal-fchip__search">
              <span className="sr-only">Search people</span>
              <input
                type="search"
                className="vp-internal-fchip__search-input"
                placeholder="Search people…"
                value={peopleQuery}
                onChange={(e) => setPeopleQuery(e.target.value)}
              />
            </label>
            <div className="vp-internal-fpeople">
              {filteredPeopleGroups.length === 0 ? (
                <p className="vp-internal-fchip__empty">
                  {peopleQuery.trim()
                    ? 'No matching people'
                    : 'No people credited'}
                </p>
              ) : (
                filteredPeopleGroups.map(({group, options}) => (
                  <section
                    key={group.libraryKey}
                    className="vp-internal-fpeople__group"
                    aria-label={group.label}
                  >
                    <h3 className="vp-internal-fpeople__heading">
                      {group.label}
                    </h3>
                    <FilterOptionList
                      options={options}
                      selectedValue={filters[group.libraryKey]}
                      onSelect={(value) =>
                        patchFilter(group.libraryKey, value)
                      }
                    />
                  </section>
                ))
              )}
            </div>
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
            <option value="client-asc">Client A–Z</option>
            <option value="client-desc">Client Z–A</option>
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
