'use client';

/**
 * Bottom sheet filter UI for the /work PortfolioIndexCarousel.
 * Two-level local navigation (taxonomy list → term list); live-applies
 * via shared PortfolioGrid public-filter helpers.
 */

import {useEffect, useMemo, useRef, useState, type PointerEvent} from 'react';
import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import type {PortfolioGridEntry, TaxonomyTerm} from '@/types/sanity';
import {
  publicFilterOptions,
  type PublicFilters,
} from './PortfolioGrid';
import type {PortfolioIndexSlide} from './prepare-portfolio-index-slides';
import './portfolio-index-filter-sheet.css';

type TaxonomyKey = keyof PublicFilters;
type SheetView = 'root' | TaxonomyKey;

interface PortfolioIndexFilterSheetProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  phrases?: Record<string, string>;
  slides: PortfolioIndexSlide[];
  filters: PublicFilters;
  onChangeFilter: (key: TaxonomyKey, value: string) => void;
  onClearAll: () => void;
  videoFormats: TaxonomyTerm[];
  industries: TaxonomyTerm[];
  markets: TaxonomyTerm[];
}

const TAXONOMY_ORDER: TaxonomyKey[] = ['format', 'industry', 'market'];

const TAXONOMY_LABEL_KEY: Record<TaxonomyKey, 'videoFormat' | 'industry' | 'market'> =
  {
    format: 'videoFormat',
    industry: 'industry',
    market: 'market',
  };

function stripOptionChrome(label: string): string {
  return label.replace(/^\u00A0+/, '').replace(/ \(\d+\)$/, '');
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6.4 6.4a.75.75 0 0 1 1.06 0L12 10.94l4.54-4.54a.75.75 0 1 1 1.06 1.06L13.06 12l4.54 4.54a.75.75 0 1 1-1.06 1.06L12 13.06l-4.54 4.54a.75.75 0 0 1-1.06-1.06L10.94 12 6.4 7.46a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M14.78 5.47a.75.75 0 0 1 0 1.06L9.31 12l5.47 5.47a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}

export function PortfolioIndexFilterSheet({
  open,
  onClose,
  locale,
  phrases,
  slides,
  filters,
  onChangeFilter,
  onClearAll,
  videoFormats,
  industries,
  markets,
}: PortfolioIndexFilterSheetProps) {
  const t = useTranslations('Filters');
  const [view, setView] = useState<SheetView>('root');
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragDeltaRef = useRef(0);

  const filterEntries = slides as unknown as PortfolioGridEntry[];

  const formatOptions = useMemo(
    () =>
      publicFilterOptions(
        filterEntries,
        filters,
        'format',
        videoFormats,
        locale,
        phrases,
      ),
    [filterEntries, filters, videoFormats, locale, phrases],
  );
  const industryOptions = useMemo(
    () =>
      publicFilterOptions(
        filterEntries,
        filters,
        'industry',
        industries,
        locale,
        phrases,
      ),
    [filterEntries, filters, industries, locale, phrases],
  );
  const marketOptions = useMemo(
    () =>
      publicFilterOptions(
        filterEntries,
        filters,
        'market',
        markets,
        locale,
        phrases,
      ),
    [filterEntries, filters, markets, locale, phrases],
  );

  const optionsByKey: Record<
    TaxonomyKey,
    {value: string; label: string; disabled: boolean}[]
  > = {
    format: formatOptions,
    industry: industryOptions,
    market: marketOptions,
  };

  const hasActiveFilters = Boolean(
    filters.format || filters.industry || filters.market,
  );

  useEffect(() => {
    if (!open) {
      setView('root');
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const selectedLabel = (key: TaxonomyKey) => {
    const value = filters[key];
    if (!value) return t('all');
    const match = optionsByKey[key].find((opt) => opt.value === value);
    return match ? stripOptionChrome(match.label) : value;
  };

  const onTermActivate = (key: TaxonomyKey, value: string) => {
    // Radio within taxonomy: re-tap clears back to All.
    onChangeFilter(key, filters[key] === value ? '' : value);
    // One term per taxonomy — return to parents so the next pick is clear.
    setView('root');
  };

  const onSelectAll = (key: TaxonomyKey) => {
    onChangeFilter(key, '');
    setView('root');
  };

  const onHandlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    dragDeltaRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current == null) return;
    const delta = Math.max(0, event.clientY - dragStartYRef.current);
    dragDeltaRef.current = delta;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const onHandlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current == null) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const shouldClose = dragDeltaRef.current > 96;
    dragStartYRef.current = null;
    dragDeltaRef.current = 0;
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    if (shouldClose) onClose();
  };

  const title =
    view === 'root' ? t('filter') : t(TAXONOMY_LABEL_KEY[view]);

  return (
    <div className="vp-index-filter-sheet" role="presentation">
      <button
        type="button"
        className="vp-index-filter-sheet__scrim"
        aria-label={t('closeFilterAria')}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="vp-index-filter-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('filter')}
      >
        <div
          className="vp-index-filter-sheet__handle-hit"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div className="vp-index-filter-sheet__handle" aria-hidden />
        </div>

        <div className="vp-index-filter-sheet__header">
          {view === 'root' ? (
            <span className="vp-index-filter-sheet__header-spacer" aria-hidden />
          ) : (
            <button
              type="button"
              className="vp-index-filter-sheet__icon-btn"
              aria-label={t('backToFiltersAria')}
              onClick={() => setView('root')}
            >
              <BackIcon />
            </button>
          )}
          <h2 className="vp-index-filter-sheet__title">{title}</h2>
          <button
            type="button"
            className="vp-index-filter-sheet__icon-btn"
            aria-label={t('closeFilterAria')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        {hasActiveFilters ? (
          <div className="vp-index-filter-sheet__clear-row">
            <button
              type="button"
              className="vp-index-filter-sheet__clear"
              onClick={onClearAll}
            >
              {t('clearAll')}
            </button>
          </div>
        ) : null}

        <div className="vp-index-filter-sheet__body">
          {view === 'root' ? (
            <ul className="vp-index-filter-sheet__list">
              {TAXONOMY_ORDER.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    className="vp-index-filter-sheet__row"
                    onClick={() => setView(key)}
                  >
                    <span className="vp-index-filter-sheet__row-label">
                      {t(TAXONOMY_LABEL_KEY[key])}
                    </span>
                    <span className="vp-index-filter-sheet__row-value">
                      {selectedLabel(key)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="vp-index-filter-sheet__list" role="listbox">
              <li>
                <button
                  type="button"
                  className={`vp-index-filter-sheet__term${
                    !filters[view] ? ' is-selected' : ''
                  }`}
                  role="option"
                  aria-selected={!filters[view]}
                  onClick={() => onSelectAll(view)}
                >
                  {t('all')}
                </button>
              </li>
              {optionsByKey[view].map((opt) => {
                const selected = filters[view] === opt.value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      className={`vp-index-filter-sheet__term${
                        selected ? ' is-selected' : ''
                      }`}
                      role="option"
                      aria-selected={selected}
                      disabled={opt.disabled && !selected}
                      onClick={() => onTermActivate(view, opt.value)}
                    >
                      {opt.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
