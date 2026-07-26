/**
 * WorkInternalToolbar — search, filters, sort, view toggle, clear, result count.
 */

'use client';

import { useMemo } from 'react';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { flattenTaxonomyTree, optionIndent } from '@/lib/taxonomy-tree';
import type {
  CreditIdentityTerm,
  InternalLibraryEntry,
  TaxonomyTerm,
} from '@/types/sanity';
import {
  countFacetOptions,
  type LibraryFilterContext,
} from './filter-entries';
import { hasActiveFilters } from './url-state';
import type {
  LibraryFilters,
  LibrarySort,
  LibraryViewMode,
} from './types';

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
  onClear: () => void;
}

function optionCountLabel(count: number, label: string): string {
  return count > 0 ? `${label} (${count})` : label;
}

function identityOptionsWithCounts(
  terms: CreditIdentityTerm[],
  counts: Map<string, number>,
  selectedId: string,
): { value: string; label: string; disabled: boolean }[] {
  return terms.map((term) => {
    const count = counts.get(term._id) ?? 0;
    return {
      value: term._id,
      label: optionCountLabel(count, decodeHtmlEntities(term.name)),
      disabled: count === 0 && selectedId !== term._id,
    };
  });
}

function taxonomyOptionsWithCounts(
  terms: TaxonomyTerm[],
  counts: Map<string, number>,
  selectedSlug: string,
): { value: string; label: string; disabled: boolean }[] {
  return flattenTaxonomyTree(terms).map(({ term, depth }) => {
    const count = counts.get(term.slug) ?? 0;
    return {
      value: term.slug,
      label:
        optionIndent(depth) +
        optionCountLabel(count, decodeHtmlEntities(term.title)),
      disabled: count === 0 && selectedSlug !== term.slug,
    };
  });
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
  onClear,
}: WorkInternalToolbarProps) {
  const active = hasActiveFilters(filters);

  function patchFilter<K extends keyof LibraryFilters>(
    key: K,
    value: LibraryFilters[K],
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  // Facet counts ignore free-text search so typing never re-scores every
  // dropdown option. Dropdown/visibility changes still update counts.
  const facetFilters = useMemo(
    (): LibraryFilters => ({ ...deferredFilters, q: '' }),
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

  const clientSelectOptions = useMemo(() => {
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'client',
      clients.map((c) => c._id),
      filterCtx,
    );
    return identityOptionsWithCounts(clients, counts, facetFilters.client);
  }, [entries, facetFilters, clients, filterCtx]);

  const directorSelectOptions = useMemo(() => {
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'director',
      directors.map((c) => c._id),
      filterCtx,
    );
    return identityOptionsWithCounts(
      directors,
      counts,
      facetFilters.director,
    );
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

  const formatSelectOptions = useMemo(() => {
    const flat = flattenTaxonomyTree(videoFormats);
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'format',
      flat.map(({ term }) => term.slug),
      filterCtx,
    );
    return taxonomyOptionsWithCounts(
      videoFormats,
      counts,
      facetFilters.format,
    );
  }, [entries, facetFilters, videoFormats, filterCtx]);

  const industrySelectOptions = useMemo(() => {
    const flat = flattenTaxonomyTree(industries);
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'industry',
      flat.map(({ term }) => term.slug),
      filterCtx,
    );
    return taxonomyOptionsWithCounts(
      industries,
      counts,
      facetFilters.industry,
    );
  }, [entries, facetFilters, industries, filterCtx]);

  const marketSelectOptions = useMemo(() => {
    const flat = flattenTaxonomyTree(markets);
    const counts = countFacetOptions(
      entries,
      facetFilters,
      'market',
      flat.map(({ term }) => term.slug),
      filterCtx,
    );
    return taxonomyOptionsWithCounts(
      markets,
      counts,
      facetFilters.market,
    );
  }, [entries, facetFilters, markets, filterCtx]);

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

          <div className="vp-internal-view-toggle" role="group" aria-label="View mode">
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
        </div>
      </div>

      <div className="vp-internal-toolbar__row vp-internal-toolbar__row--filters">
        <FilterSelect
          label="Client"
          value={filters.client}
          onChange={(v) => patchFilter('client', v)}
          options={clientSelectOptions}
        />
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
        <FilterSelect
          label="Format"
          value={filters.format}
          onChange={(v) => patchFilter('format', v)}
          options={formatSelectOptions}
        />
        <FilterSelect
          label="Industry"
          value={filters.industry}
          onChange={(v) => patchFilter('industry', v)}
          options={industrySelectOptions}
        />
        <FilterSelect
          label="Market"
          value={filters.market}
          onChange={(v) => patchFilter('market', v)}
          options={marketSelectOptions}
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
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled: boolean }[];
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
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
