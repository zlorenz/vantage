'use client';

/**
 * Filter UI for the /work PortfolioIndexCarousel.
 *
 * Mobile (<576px): shared BottomSheet shell (scrim + drag-to-dismiss).
 * Desktop (≥576px): anchored popout above the filter trigger (nav-dropdown
 * pattern — max-content width, fade + translate, no scrim). Same drill-in
 * view state either way.
 *
 * Nested taxonomy views: compositor-only horizontal push/pop on the body
 * (header/handle stay put). Menu height follows content when each view
 * settles — no height tween (that dropped frames).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {useTranslations} from 'next-intl';
import {BottomSheet} from '@/components/ui/BottomSheet';
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
type DrillDirection = 'forward' | 'back';

interface DrillTransition {
  from: SheetView;
  to: SheetView;
  direction: DrillDirection;
}

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
/** Nested panel horizontal push/pop. */
const DRILL_MS = 240;
const DESKTOP_MQ = '(min-width: 576px)';

function stripOptionChrome(label: string): string {
  return label.replace(/^\u00A0+/, '').replace(/ \(\d+\)$/, '');
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const [activeView, setActiveView] = useState<SheetView>('root');
  const [drill, setDrill] = useState<DrillTransition | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drillRunIdRef = useRef(0);

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

  /** Header follows the destination as soon as a drill starts. */
  const chromeView = drill?.to ?? activeView;

  const resetFilterView = useCallback(() => {
    if (drillTimerRef.current) {
      clearTimeout(drillTimerRef.current);
      drillTimerRef.current = null;
    }
    setDrill(null);
    setActiveView('root');
    drillRunIdRef.current += 1;
  }, []);

  const goToView = (next: SheetView) => {
    if (drill) return;
    if (next === activeView) return;

    if (prefersReducedMotion()) {
      setActiveView(next);
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const direction: DrillDirection = next === 'root' ? 'back' : 'forward';
    setDrill({from: activeView, to: next, direction});
  };

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Desktop popout: mount / reveal / delayed unmount (exit animation).
  // Mobile sheet mount lifecycle lives in BottomSheet.
  useEffect(() => {
    if (!isDesktop) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setMounted(false);
      setVisible(false);
      return;
    }

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

    const finishClose = () => {
      resetFilterView();
      setMounted(false);
      closeTimerRef.current = null;
    };

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    closeTimerRef.current = setTimeout(finishClose, DESKTOP_CLOSE_MS);
  }, [open, mounted, isDesktop, resetFilterView]);

  useEffect(() => {
    if (!isDesktop || !open || !mounted) return;

    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(timer);
  }, [open, mounted, isDesktop]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (drillTimerRef.current) clearTimeout(drillTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || !isDesktop) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isDesktop, onClose]);

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

  // Compositor-only swipe: pixel translate3d, no React state until settle.
  // Forward: 0 → -width. Back: -width → 0.
  useLayoutEffect(() => {
    if (!drill) return;

    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const runId = ++drillRunIdRef.current;
    const width = viewport.offsetWidth;
    const startX = drill.direction === 'back' ? -width : 0;
    const endX = drill.direction === 'back' ? 0 : -width;

    track.style.transition = 'none';
    track.style.transform = `translate3d(${startX}px,0,0)`;
    void track.offsetWidth;

    const raf = requestAnimationFrame(() => {
      if (drillRunIdRef.current !== runId) return;
      track.style.transition = `transform ${DRILL_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      track.style.transform = `translate3d(${endX}px,0,0)`;
    });

    if (drillTimerRef.current) clearTimeout(drillTimerRef.current);
    const toView = drill.to;
    drillTimerRef.current = setTimeout(() => {
      if (drillRunIdRef.current !== runId) return;
      setActiveView(toView);
      setDrill(null);
      track.style.transition = '';
      track.style.transform = '';
      drillTimerRef.current = null;
    }, DRILL_MS);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [drill]);

  const selectedLabel = (key: TaxonomyKey) => {
    const value = filters[key];
    if (!value) return t('all');
    const match = optionsByKey[key].find((opt) => opt.value === value);
    return match ? stripOptionChrome(match.label) : value;
  };

  const onTermActivate = (key: TaxonomyKey, value: string) => {
    onChangeFilter(key, filters[key] === value ? '' : value);
    goToView('root');
  };

  const onSelectAll = (key: TaxonomyKey) => {
    onChangeFilter(key, '');
    goToView('root');
  };

  const title =
    chromeView === 'root' ? t('filter') : t(TAXONOMY_LABEL_KEY[chromeView]);

  const renderView = (view: SheetView): ReactNode => {
    if (view === 'root') {
      return (
        <ul className="vp-index-filter-sheet__list">
          {TAXONOMY_ORDER.map((key) => (
            <li key={key}>
              <button
                type="button"
                className="vp-index-filter-sheet__row"
                onClick={() => goToView(key)}
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
      );
    }

    return (
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
    );
  };

  const headerStart =
    chromeView === 'root' ? (
      hasActiveFilters ? (
        <button
          type="button"
          className="vp-index-filter-sheet__clear"
          onClick={onClearAll}
        >
          {t('clearAll')}
        </button>
      ) : (
        <span className="vp-bottom-sheet__header-spacer" aria-hidden />
      )
    ) : (
      <button
        type="button"
        className="vp-bottom-sheet__icon-btn vp-index-filter-sheet__icon-btn"
        aria-label={t('backToFiltersAria')}
        onClick={() => goToView('root')}
        disabled={Boolean(drill)}
      >
        <BackIcon />
      </button>
    );

  const drillBody = (
    <div
      className={`vp-index-filter-sheet__viewport-wrap${
        drill ? ' is-drilling' : ''
      }`}
    >
      <div ref={viewportRef} className="vp-index-filter-sheet__viewport">
        <div
          ref={trackRef}
          className={`vp-index-filter-sheet__track${
            drill ? ' is-sliding' : ''
          }`}
        >
          {drill ? (
            drill.direction === 'forward' ? (
              <>
                <div className="vp-index-filter-sheet__pane" aria-hidden>
                  {renderView(drill.from)}
                </div>
                <div className="vp-index-filter-sheet__pane vp-index-filter-sheet__pane--incoming">
                  {renderView(drill.to)}
                </div>
              </>
            ) : (
              <>
                <div className="vp-index-filter-sheet__pane vp-index-filter-sheet__pane--incoming">
                  {renderView(drill.to)}
                </div>
                <div className="vp-index-filter-sheet__pane" aria-hidden>
                  {renderView(drill.from)}
                </div>
              </>
            )
          ) : (
            <div className="vp-index-filter-sheet__pane">
              {renderView(activeView)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile: shared BottomSheet shell.
  if (!isDesktop) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={title}
        closeAriaLabel={t('closeFilterAria')}
        headerStart={headerStart}
        bodyClassName={drill ? 'is-drilling' : undefined}
        onClosed={resetFilterView}
      >
        {drillBody}
      </BottomSheet>
    );
  }

  // Desktop: anchored popout (unchanged visual path).
  if (!mounted) return null;

  return (
    <div
      ref={rootRef}
      className={`vp-index-filter-sheet${visible ? ' is-open' : ''}`}
      role="presentation"
    >
      <div
        className="vp-index-filter-sheet__panel"
        role="dialog"
        aria-modal={false}
        aria-label={t('filter')}
        aria-hidden={!visible}
      >
        <div className="vp-index-filter-sheet__header">
          <div className="vp-index-filter-sheet__header-start">
            {chromeView === 'root' ? (
              hasActiveFilters ? (
                <button
                  type="button"
                  className="vp-index-filter-sheet__clear"
                  onClick={onClearAll}
                >
                  {t('clearAll')}
                </button>
              ) : (
                <span
                  className="vp-index-filter-sheet__header-spacer"
                  aria-hidden
                />
              )
            ) : (
              <button
                type="button"
                className="vp-index-filter-sheet__icon-btn"
                aria-label={t('backToFiltersAria')}
                onClick={() => goToView('root')}
                disabled={Boolean(drill)}
              >
                <BackIcon />
              </button>
            )}
          </div>
          <h2 className="vp-index-filter-sheet__title">{title}</h2>
          <div className="vp-index-filter-sheet__header-end">
            <button
              type="button"
              className="vp-index-filter-sheet__icon-btn"
              aria-label={t('closeFilterAria')}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div
          className={`vp-index-filter-sheet__body${
            drill ? ' is-drilling' : ''
          }`}
        >
          {drillBody}
        </div>
      </div>
    </div>
  );
}
