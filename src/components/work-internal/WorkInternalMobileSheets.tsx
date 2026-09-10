/**
 * Mobile filter + sort bottom sheets for /work-internal (<768px).
 *
 * Filter sheet uses a drill-in hierarchy (same motion language as the
 * /work PortfolioIndexFilterSheet): root keeps Visibility + Categories /
 * Brands / Crew rows; each section opens a nested pane that swipes in
 * from the right. Sort sheet is a flat polished choice list.
 */

'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {BottomSheet} from '@/components/ui/BottomSheet';
import type {LibrarySort, VisibilityFilter} from './types';
import {
  FilterOptionList,
  type FilterPanelOption,
} from './WorkInternalFilterPanel';
import type {NestedFilterSection} from './NestedFilterMenu';

const DRILL_MS = 320;

const SORT_OPTIONS: {value: LibrarySort; label: string}[] = [
  {value: 'publishedAt-desc', label: 'Newest first'},
  {value: 'publishedAt-asc', label: 'Oldest first'},
  {value: 'title-asc', label: 'Title A–Z'},
  {value: 'title-desc', label: 'Title Z–A'},
  {value: 'client-asc', label: 'Brand A–Z'},
  {value: 'client-desc', label: 'Brand Z–A'},
];

type RootSection = 'categories' | 'brands' | 'crew';
type SheetView =
  | 'root'
  | RootSection
  | `cat:${string}`
  | `crew:${string}`;

type DrillDirection = 'forward' | 'back';

type DrillTransition = {
  from: SheetView;
  to: SheetView;
  direction: DrillDirection;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

function ChevronIcon() {
  return (
    <svg
      className="vp-internal-sheet__chevron-icon"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5.5 3 L10.5 8 L5.5 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function selectedSummary(
  sections: NestedFilterSection[],
): string {
  const active = sections.filter((s) => s.hasSelection);
  if (active.length === 0) return 'All';
  if (active.length === 1) {
    const section = active[0];
    const match = section.options.find(
      (opt) => opt.value === section.selectedValue,
    );
    return match?.label ?? section.label;
  }
  return `${active.length} selected`;
}

function brandSummary(
  options: FilterPanelOption[],
  selected: string,
): string {
  if (!selected) return 'All';
  return options.find((opt) => opt.value === selected)?.label ?? '1 selected';
}

interface WorkInternalSortSheetProps {
  open: boolean;
  onClose: () => void;
  sort: LibrarySort;
  onSortChange: (sort: LibrarySort) => void;
}

export function WorkInternalSortSheet({
  open,
  onClose,
  sort,
  onSortChange,
}: WorkInternalSortSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Sort"
      closeAriaLabel="Close sort"
      bodyClassName="vp-internal-sheet__body"
    >
      <ul
        className="vp-internal-sheet__choice-list"
        role="listbox"
        aria-label="Sort"
      >
        {SORT_OPTIONS.map((opt) => {
          const selected = opt.value === sort;
          return (
            <li key={opt.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={
                  selected
                    ? 'vp-internal-sheet__choice is-selected'
                    : 'vp-internal-sheet__choice'
                }
                onClick={() => {
                  onSortChange(opt.value);
                  onClose();
                }}
              >
                <span>{opt.label}</span>
                {selected ? (
                  <span className="vp-internal-sheet__choice-check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}

interface WorkInternalFilterSheetProps {
  open: boolean;
  onClose: () => void;
  visibility: VisibilityFilter;
  onVisibilityChange: (value: VisibilityFilter) => void;
  categorySections: NestedFilterSection[];
  brandOptions: FilterPanelOption[];
  brandSelected: string;
  onBrandSelect: (value: string) => void;
  crewSections: NestedFilterSection[];
  hasActiveFilters: boolean;
  onClear: () => void;
}

export function WorkInternalFilterSheet({
  open,
  onClose,
  visibility,
  onVisibilityChange,
  categorySections,
  brandOptions,
  brandSelected,
  onBrandSelect,
  crewSections,
  hasActiveFilters,
  onClear,
}: WorkInternalFilterSheetProps) {
  const [activeView, setActiveView] = useState<SheetView>('root');
  const [drill, setDrill] = useState<DrillTransition | null>(null);
  const [brandQuery, setBrandQuery] = useState('');
  const [sectionQuery, setSectionQuery] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drillRunIdRef = useRef(0);

  const categoryById = useMemo(
    () => new Map(categorySections.map((s) => [s.id, s])),
    [categorySections],
  );
  const crewById = useMemo(
    () => new Map(crewSections.map((s) => [s.id, s])),
    [crewSections],
  );

  const chromeView = drill?.to ?? activeView;

  const resetFilterView = () => {
    if (drillTimerRef.current) {
      clearTimeout(drillTimerRef.current);
      drillTimerRef.current = null;
    }
    setDrill(null);
    setActiveView('root');
    setBrandQuery('');
    setSectionQuery('');
    drillRunIdRef.current += 1;
  };

  useEffect(() => {
    if (!open) return;
    // Reset when sheet opens fresh (closed→open handled via onClosed too).
  }, [open]);

  useEffect(() => {
    return () => {
      if (drillTimerRef.current) clearTimeout(drillTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setBrandQuery('');
    setSectionQuery('');
  }, [activeView]);

  const parentOf = (view: SheetView): SheetView => {
    if (view.startsWith('cat:')) return 'categories';
    if (view.startsWith('crew:')) return 'crew';
    if (view === 'categories' || view === 'brands' || view === 'crew') {
      return 'root';
    }
    return 'root';
  };

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

    const direction: DrillDirection =
      next === 'root' || next === parentOf(activeView) ? 'back' : 'forward';
    setDrill({from: activeView, to: next, direction});
  };

  const goBack = () => goToView(parentOf(chromeView));

  // Compositor-only swipe: pixel translate3d, no React state until settle.
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

  const titleFor = (view: SheetView): string => {
    if (view === 'root') return 'Filters';
    if (view === 'categories') return 'Categories';
    if (view === 'brands') return 'Brands';
    if (view === 'crew') return 'Crew';
    if (view.startsWith('cat:')) {
      return categoryById.get(view.slice(4))?.label ?? 'Categories';
    }
    if (view.startsWith('crew:')) {
      return crewById.get(view.slice(5))?.label ?? 'Crew';
    }
    return 'Filters';
  };

  const renderSectionOptions = (section: NestedFilterSection): ReactNode => {
    const filtered =
      sectionQuery.trim()
        ? section.options.filter((opt) =>
            opt.label
              .toLowerCase()
              .includes(sectionQuery.trim().toLowerCase()),
          )
        : section.options;

    return (
      <div className="vp-internal-sheet__pane-inner">
        {section.searchPlaceholder ? (
          <label className="vp-internal-sheet__search">
            <span className="sr-only">{section.searchPlaceholder}</span>
            <input
              type="search"
              className="vp-internal-sheet__search-input"
              placeholder={section.searchPlaceholder}
              value={sectionQuery}
              onChange={(e) => setSectionQuery(e.target.value)}
            />
          </label>
        ) : null}
        <FilterOptionList
          options={filtered}
          selectedValue={section.selectedValue}
          onSelect={section.onSelect}
          emptyLabel={
            sectionQuery.trim()
              ? 'No matches'
              : (section.emptyLabel ?? 'No options')
          }
        />
      </div>
    );
  };

  const renderView = (view: SheetView): ReactNode => {
    if (view === 'root') {
      return (
        <div className="vp-internal-sheet__pane-inner">
          <div className="vp-internal-sheet__section">
            <h3 className="vp-internal-sheet__section-label">Visibility</h3>
            <div
              className="vp-internal-sheet__segment"
              role="group"
              aria-label="Visibility"
            >
              {(
                [
                  {value: 'all', label: 'All'},
                  {value: 'public', label: 'Public'},
                  {value: 'hidden', label: 'Hidden'},
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={
                    visibility === opt.value
                      ? 'vp-internal-sheet__segment-btn is-active'
                      : 'vp-internal-sheet__segment-btn'
                  }
                  aria-pressed={visibility === opt.value}
                  onClick={() => onVisibilityChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="vp-internal-sheet__nav-list" aria-label="Filter sections">
            {(
              [
                {
                  id: 'categories' as const,
                  label: 'Categories',
                  value: selectedSummary(categorySections),
                  active: categorySections.some((s) => s.hasSelection),
                },
                {
                  id: 'brands' as const,
                  label: 'Brands',
                  value: brandSummary(brandOptions, brandSelected),
                  active: Boolean(brandSelected),
                },
                {
                  id: 'crew' as const,
                  label: 'Crew',
                  value: selectedSummary(crewSections),
                  active: crewSections.some((s) => s.hasSelection),
                },
              ] as const
            ).map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className={
                    row.active
                      ? 'vp-internal-sheet__nav-row has-selection'
                      : 'vp-internal-sheet__nav-row'
                  }
                  onClick={() => goToView(row.id)}
                >
                  <span className="vp-internal-sheet__nav-label">
                    {row.label}
                  </span>
                  <span className="vp-internal-sheet__nav-meta">
                    <span className="vp-internal-sheet__nav-value">
                      {row.value}
                    </span>
                    <ChevronIcon />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (view === 'categories') {
      return (
        <div className="vp-internal-sheet__pane-inner">
          <ul className="vp-internal-sheet__nav-list" aria-label="Categories">
            {categorySections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className={
                    section.hasSelection
                      ? 'vp-internal-sheet__nav-row has-selection'
                      : 'vp-internal-sheet__nav-row'
                  }
                  onClick={() => goToView(`cat:${section.id}`)}
                >
                  <span className="vp-internal-sheet__nav-label">
                    {section.label}
                  </span>
                  <span className="vp-internal-sheet__nav-meta">
                    <span className="vp-internal-sheet__nav-value">
                      {section.hasSelection
                        ? (section.options.find(
                            (opt) => opt.value === section.selectedValue,
                          )?.label ?? 'Selected')
                        : 'All'}
                    </span>
                    <ChevronIcon />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (view === 'brands') {
      const filtered = brandQuery.trim()
        ? brandOptions.filter((opt) =>
            opt.label
              .toLowerCase()
              .includes(brandQuery.trim().toLowerCase()),
          )
        : brandOptions;

      return (
        <div className="vp-internal-sheet__pane-inner">
          <label className="vp-internal-sheet__search">
            <span className="sr-only">Search brands</span>
            <input
              type="search"
              className="vp-internal-sheet__search-input"
              placeholder="Search brands…"
              value={brandQuery}
              onChange={(e) => setBrandQuery(e.target.value)}
            />
          </label>
          <FilterOptionList
            options={filtered}
            selectedValue={brandSelected}
            onSelect={onBrandSelect}
            emptyLabel={
              brandQuery.trim() ? 'No matching brands' : 'No brands'
            }
          />
        </div>
      );
    }

    if (view === 'crew') {
      return (
        <div className="vp-internal-sheet__pane-inner">
          <ul className="vp-internal-sheet__nav-list" aria-label="Crew roles">
            {crewSections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className={
                    section.hasSelection
                      ? 'vp-internal-sheet__nav-row has-selection'
                      : 'vp-internal-sheet__nav-row'
                  }
                  onClick={() => goToView(`crew:${section.id}`)}
                >
                  <span className="vp-internal-sheet__nav-label">
                    {section.label}
                  </span>
                  <span className="vp-internal-sheet__nav-meta">
                    <span className="vp-internal-sheet__nav-value">
                      {section.hasSelection
                        ? (section.options.find(
                            (opt) => opt.value === section.selectedValue,
                          )?.label ?? 'Selected')
                        : 'All'}
                    </span>
                    <ChevronIcon />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (view.startsWith('cat:')) {
      const section = categoryById.get(view.slice(4));
      if (!section) return null;
      return renderSectionOptions(section);
    }

    if (view.startsWith('crew:')) {
      const section = crewById.get(view.slice(5));
      if (!section) return null;
      return renderSectionOptions(section);
    }

    return null;
  };

  const headerStart =
    chromeView === 'root' ? (
      hasActiveFilters ? (
        <button
          type="button"
          className="vp-internal-sheet__clear"
          onClick={onClear}
        >
          Clear
        </button>
      ) : undefined
    ) : (
      <button
        type="button"
        className="vp-bottom-sheet__icon-btn"
        aria-label="Back"
        onClick={goBack}
        disabled={Boolean(drill)}
      >
        <BackIcon />
      </button>
    );

  const drillBody = (
    <div
      className={`vp-internal-sheet__viewport-wrap${
        drill ? ' is-drilling' : ''
      }`}
    >
      <div ref={viewportRef} className="vp-internal-sheet__viewport">
        <div
          ref={trackRef}
          className={`vp-internal-sheet__track${drill ? ' is-sliding' : ''}`}
        >
          {drill ? (
            drill.direction === 'forward' ? (
              <>
                <div className="vp-internal-sheet__pane" aria-hidden>
                  {renderView(drill.from)}
                </div>
                <div className="vp-internal-sheet__pane vp-internal-sheet__pane--incoming">
                  {renderView(drill.to)}
                </div>
              </>
            ) : (
              <>
                <div className="vp-internal-sheet__pane vp-internal-sheet__pane--incoming">
                  {renderView(drill.to)}
                </div>
                <div className="vp-internal-sheet__pane" aria-hidden>
                  {renderView(drill.from)}
                </div>
              </>
            )
          ) : (
            <div className="vp-internal-sheet__pane">
              {renderView(activeView)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={titleFor(chromeView)}
      closeAriaLabel="Close filters"
      bodyClassName={
        drill
          ? 'vp-internal-sheet__body is-drilling'
          : 'vp-internal-sheet__body'
      }
      headerStart={headerStart}
      onClosed={resetFilterView}
    >
      {drillBody}
    </BottomSheet>
  );
}
