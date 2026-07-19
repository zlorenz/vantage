/**
 * WorkInternalToolbar — search, filters, sort, view toggle, clear, result count.
 */

'use client';

import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { flattenTaxonomyTree, optionIndent } from '@/lib/taxonomy-tree';
import type {
  ClientTerm,
  CrewMemberTerm,
  InternalLibraryEntry,
  TaxonomyTerm,
} from '@/types/sanity';
import {
  countForFilterValue,
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
  filters: LibraryFilters;
  sort: LibrarySort;
  view: LibraryViewMode;
  resultCount: number;
  totalCount: number;
  clients: ClientTerm[];
  directors: CrewMemberTerm[];
  dops: CrewMemberTerm[];
  artDirectors: CrewMemberTerm[];
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

export function WorkInternalToolbar({
  entries,
  filters,
  sort,
  view,
  resultCount,
  totalCount,
  clients,
  directors,
  dops,
  artDirectors,
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

  function slugOption(
    key: keyof LibraryFilters,
    slug: string,
    label: string,
  ): { value: string; label: string; disabled: boolean } {
    const count = countForFilterValue(
      entries,
      filters,
      key,
      slug,
      filterCtx,
    );
    return {
      value: slug,
      label: optionCountLabel(count, decodeHtmlEntities(label)),
      disabled: count === 0 && filters[key] !== slug,
    };
  }

  /** Taxonomy options ordered parent-first with indented subcategories. */
  function taxonomyOptions(
    key: keyof LibraryFilters,
    terms: TaxonomyTerm[],
  ): { value: string; label: string; disabled: boolean }[] {
    return flattenTaxonomyTree(terms).map(({ term, depth }) => {
      const opt = slugOption(key, term.slug, term.title);
      return { ...opt, label: optionIndent(depth) + opt.label };
    });
  }

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
          <span className="vp-internal-count" aria-live="polite">
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
          options={clients.map((c) =>
            slugOption('client', c.slug, c.name),
          )}
        />
        <FilterSelect
          label="Director"
          value={filters.director}
          onChange={(v) => patchFilter('director', v)}
          options={directors.map((c) =>
            slugOption('director', c.slug, c.name),
          )}
        />
        <FilterSelect
          label="DOP"
          value={filters.dop}
          onChange={(v) => patchFilter('dop', v)}
          options={dops.map((c) => slugOption('dop', c.slug, c.name))}
        />
        <FilterSelect
          label="Art Director"
          value={filters['art-director']}
          onChange={(v) => patchFilter('art-director', v)}
          options={artDirectors.map((c) =>
            slugOption('art-director', c.slug, c.name),
          )}
        />
        <FilterSelect
          label="Format"
          value={filters.format}
          onChange={(v) => patchFilter('format', v)}
          options={taxonomyOptions('format', videoFormats)}
        />
        <FilterSelect
          label="Industry"
          value={filters.industry}
          onChange={(v) => patchFilter('industry', v)}
          options={taxonomyOptions('industry', industries)}
        />
        <FilterSelect
          label="Market"
          value={filters.market}
          onChange={(v) => patchFilter('market', v)}
          options={taxonomyOptions('market', markets)}
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
