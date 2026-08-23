'use client';

/**
 * Filter UI for the /work PortfolioIndexCarousel.
 *
 * Mobile (<576px): full-viewport bottom sheet with scrim + drag-to-dismiss.
 * Desktop (≥576px): anchored popout above the filter trigger (nav-dropdown
 * pattern — max-content width, fade + translate, no scrim). Same drill-in
 * view state either way.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
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

/** Matches nav desktop panel close timing (`NavBar` CLOSE_MS). */
const DESKTOP_CLOSE_MS = 180;
const DESKTOP_MQ = '(min-width: 576px)';

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
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Mount / reveal / delayed unmount (desktop exit animation only).
  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setMounted(true);
      return;
    }

    if (!mounted) return;

    setVisible(false);
    if (!isDesktop) {
      setMounted(false);
      setView('root');
      return;
    }

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) {
      setMounted(false);
      setView('root');
      return;
    }

    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
      setView('root');
      closeTimerRef.current = null;
    }, DESKTOP_CLOSE_MS);
  }, [open, mounted, isDesktop]);

  useEffect(() => {
    if (!open || !mounted) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced || !isDesktop) {
      setVisible(true);
      return;
    }

    const t = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(t);
  }, [open, mounted, isDesktop]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Desktop has no scrim — close on outside pointer (exclude trigger anchor).
  useEffect(() => {
    if (!open || !isDesktop) return;

    function onPointerDown(e: Event) {
      const target = e.target as Node | null;
      if (!target) return;
      const anchor = rootRef.current?.closest(
        '.vp-portfolio-index__filter-anchor',
      );
      if (anchor?.contains(target)) return;
      onClose();
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, isDesktop, onClose]);

  if (!mounted) return null;

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
    if (isDesktop) return;
    dragStartYRef.current = event.clientY;
    dragDeltaRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isDesktop || dragStartYRef.current == null) return;
    const delta = Math.max(0, event.clientY - dragStartYRef.current);
    dragDeltaRef.current = delta;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const onHandlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (isDesktop || dragStartYRef.current == null) return;
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
    <div
      ref={rootRef}
      className={`vp-index-filter-sheet${visible ? ' is-open' : ''}`}
      role="presentation"
    >
      <button
        type="button"
        className="vp-index-filter-sheet__scrim"
        aria-label={t('closeFilterAria')}
        onClick={onClose}
        tabIndex={isDesktop ? -1 : undefined}
      />
      <div
        ref={sheetRef}
        className="vp-index-filter-sheet__panel"
        role="dialog"
        aria-modal={!isDesktop}
        aria-label={t('filter')}
        aria-hidden={!visible}
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
