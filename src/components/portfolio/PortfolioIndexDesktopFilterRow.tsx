'use client';

/**
 * Desktop-only (≥576px) filter row for /work PortfolioIndexCarousel.
 *
 * SEARCH (left) is an always-visible inline field (Figma 77:12478 = icon +
 * “SEARCH” label chrome — no border/fill box). FORMAT / INDUSTRY / MARKET
 * (right) open independent right-rail panels — multiple may be open at once.
 * Does not replace PortfolioIndexFilterSheet or the mobile search overlay.
 */

import {useEffect, useMemo, useRef, useState, type FormEvent} from 'react';
import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import type {PortfolioGridEntry, TaxonomyTerm} from '@/types/sanity';
import {
  countForPublicFilterValue,
  publicFilterOptions,
  type PublicFilters,
} from './PortfolioGrid';
import type {PortfolioIndexSlide} from './prepare-portfolio-index-slides';
import './portfolio-index-desktop-filter-row.css';

type TaxonomyKey = keyof PublicFilters;

interface PortfolioIndexDesktopFilterRowProps {
  locale: Locale;
  phrases?: Record<string, string>;
  slides: PortfolioIndexSlide[];
  filters: PublicFilters;
  onChangeFilter: (key: TaxonomyKey, value: string) => void;
  /** Committed `q` — seeds the field on load / popstate / filter-clear. */
  searchValue: string;
  /** Enter/submit — same commit path as the mobile overlay. */
  onCommitSearch: (query: string) => void;
  /** Overlay-shared no-results string; shown inline under the field when set. */
  searchNoResultsQuery?: string;
  onClearSearchNoResults?: () => void;
  videoFormats: TaxonomyTerm[];
  industries: TaxonomyTerm[];
  markets: TaxonomyTerm[];
}

const TAXONOMY_ORDER: TaxonomyKey[] = ['format', 'industry', 'market'];

const TAXONOMY_LABEL_KEY: Record<
  TaxonomyKey,
  'videoFormat' | 'industry' | 'market'
> = {
  format: 'videoFormat',
  industry: 'industry',
  market: 'market',
};

type PanelOpenState = Record<TaxonomyKey, boolean>;

const ALL_PANELS_CLOSED: PanelOpenState = {
  format: false,
  industry: false,
  market: false,
};

function stripOptionChrome(label: string): string {
  return label.replace(/^\u00A0+/, '').replace(/ \(\d+\)$/, '');
}

/** Figma panel counts: bare n → "( n )" */
function formatPanelCount(n: number): string {
  return `( ${n} )`;
}

function SearchGlyph() {
  return (
    <svg
      className="vp-portfolio-index-desktop-filters__search-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M10.5 3.75a6.75 6.75 0 1 0 4.248 12.032l3.735 3.735a.75.75 0 1 0 1.06-1.06l-3.734-3.735A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
      />
    </svg>
  );
}

function ChevronGlyph() {
  return (
    <svg
      className="vp-portfolio-index-desktop-filters__chevron"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M6.22 9.97a.75.75 0 0 1 1.06 0L12 14.69l4.72-4.72a.75.75 0 1 1 1.06 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0l-5.25-5.25a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

export function PortfolioIndexDesktopFilterRow({
  locale,
  phrases,
  slides,
  filters,
  onChangeFilter,
  searchValue,
  onCommitSearch,
  searchNoResultsQuery = '',
  onClearSearchNoResults,
  videoFormats,
  industries,
  markets,
}: PortfolioIndexDesktopFilterRowProps) {
  const t = useTranslations('Filters');
  const tSearch = useTranslations('Search');
  const rootRef = useRef<HTMLDivElement>(null);
  const [openPanels, setOpenPanels] =
    useState<PanelOpenState>(ALL_PANELS_CLOSED);
  /** Last-opened panel sits above siblings (530px rails overlap heavily). */
  const [frontPanel, setFrontPanel] = useState<TaxonomyKey | null>(null);
  /** Local draft; mirrors committed searchValue (URL / filter clear / commit). */
  const [draftSearch, setDraftSearch] = useState(searchValue);

  useEffect(() => {
    setDraftSearch(searchValue);
  }, [searchValue]);

  const filterEntries = slides as unknown as PortfolioGridEntry[];

  const optionsByKey = useMemo(() => {
    const termsByKey: Record<TaxonomyKey, TaxonomyTerm[]> = {
      format: videoFormats,
      industry: industries,
      market: markets,
    };
    const next = {} as Record<
      TaxonomyKey,
      {value: string; label: string; disabled: boolean}[]
    >;
    for (const key of TAXONOMY_ORDER) {
      next[key] = publicFilterOptions(
        filterEntries,
        filters,
        key,
        termsByKey[key],
        locale,
        phrases,
      );
    }
    return next;
  }, [
    filterEntries,
    filters,
    locale,
    phrases,
    videoFormats,
    industries,
    markets,
  ]);

  const anyPanelOpen =
    openPanels.format || openPanels.industry || openPanels.market;

  useEffect(() => {
    if (!anyPanelOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setOpenPanels(ALL_PANELS_CLOSED);
      setFrontPanel(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPanels(ALL_PANELS_CLOSED);
        setFrontPanel(null);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [anyPanelOpen]);

  const togglePanel = (key: TaxonomyKey) => {
    setOpenPanels((prev) => {
      const nextOpen = !prev[key];
      const next = {...prev, [key]: nextOpen};
      if (nextOpen) {
        setFrontPanel(key);
      } else {
        setFrontPanel((current) => {
          if (current !== key) return current;
          return (
            TAXONOMY_ORDER.find((candidate) => candidate !== key && next[candidate]) ??
            null
          );
        });
      }
      return next;
    });
  };

  const bringPanelToFront = (key: TaxonomyKey) => {
    setFrontPanel(key);
  };

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setOpenPanels(ALL_PANELS_CLOSED);
    setFrontPanel(null);
    onCommitSearch(draftSearch);
  };

  const handleSelectAll = (key: TaxonomyKey) => {
    onChangeFilter(key, '');
  };

  const handleSelectTerm = (key: TaxonomyKey, value: string) => {
    onChangeFilter(key, filters[key] === value ? '' : value);
  };

  return (
    <div
      ref={rootRef}
      className="vp-portfolio-index-desktop-filters"
      data-desktop-filter-row
    >
      <form
        className="vp-portfolio-index-desktop-filters__search"
        role="search"
        onSubmit={handleSearchSubmit}
      >
        <SearchGlyph />
        <input
          type="search"
          className="vp-portfolio-index-desktop-filters__search-input"
          value={draftSearch}
          onChange={(event) => {
            setDraftSearch(event.target.value);
            if (searchNoResultsQuery) onClearSearchNoResults?.();
          }}
          placeholder={tSearch('title')}
          aria-label={tSearch('placeholder')}
          autoComplete="off"
          enterKeyHint="search"
        />
        {searchNoResultsQuery ? (
          <p
            className="vp-portfolio-index-desktop-filters__search-no-results"
            role="status"
            aria-live="polite"
          >
            {tSearch('noResults', {query: searchNoResultsQuery})}
          </p>
        ) : null}
      </form>

      <div className="vp-portfolio-index-desktop-filters__triggers">
        {TAXONOMY_ORDER.map((key) => {
          const open = openPanels[key];
          const label = t(TAXONOMY_LABEL_KEY[key]);
          const allSelected = !filters[key];
          const allCount = countForPublicFilterValue(
            filterEntries,
            filters,
            key,
            '',
          );

          return (
            <div
              key={key}
              className="vp-portfolio-index-desktop-filters__trigger-wrap"
            >
              <button
                type="button"
                className={`vp-portfolio-index-desktop-filters__trigger${
                  open ? ' is-open' : ''
                }`}
                aria-expanded={open}
                aria-controls={`vp-desktop-filter-panel-${key}`}
                onClick={() => togglePanel(key)}
              >
                <ChevronGlyph />
                <span className="vp-portfolio-index-desktop-filters__trigger-label">
                  {label}
                </span>
              </button>

              {open ? (
                <div
                  id={`vp-desktop-filter-panel-${key}`}
                  className={`vp-portfolio-index-desktop-filters__panel${
                    frontPanel === key ? ' is-front' : ''
                  }`}
                  role="listbox"
                  aria-label={label}
                  onPointerDown={() => bringPanelToFront(key)}
                >
                  <div className="vp-portfolio-index-desktop-filters__panel-body">
                    <button
                      type="button"
                      className={`vp-portfolio-index-desktop-filters__all${
                        allSelected ? ' is-selected' : ''
                      }`}
                      role="option"
                      aria-selected={allSelected}
                      onClick={() => handleSelectAll(key)}
                    >
                      <span className="vp-portfolio-index-desktop-filters__all-label">
                        → {t('all')}
                      </span>
                      <span className="vp-portfolio-index-desktop-filters__term-count">
                        {formatPanelCount(allCount)}
                      </span>
                    </button>

                    <ul className="vp-portfolio-index-desktop-filters__terms">
                      {optionsByKey[key].map((opt) => {
                        const isSelected = filters[key] === opt.value;
                        const termCount = countForPublicFilterValue(
                          filterEntries,
                          filters,
                          key,
                          opt.value,
                        );
                        return (
                          <li key={opt.value}>
                            <button
                              type="button"
                              className={`vp-portfolio-index-desktop-filters__term${
                                isSelected ? ' is-selected' : ''
                              }`}
                              role="option"
                              aria-selected={isSelected}
                              disabled={opt.disabled && !isSelected}
                              onClick={() =>
                                handleSelectTerm(key, opt.value)
                              }
                            >
                              <span className="vp-portfolio-index-desktop-filters__term-label">
                                {stripOptionChrome(opt.label)}
                              </span>
                              <span className="vp-portfolio-index-desktop-filters__term-count">
                                {formatPanelCount(termCount)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="vp-portfolio-index-desktop-filters__watermark"
                    src="/brand/vap-pattern.svg"
                    alt=""
                    aria-hidden="true"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
