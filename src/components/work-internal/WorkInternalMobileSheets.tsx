/**
 * Mobile filter + sort bottom sheets for /work-internal (<768px).
 * Reuses shared BottomSheet shell; utility/dark chrome (not marketing tokens).
 */

'use client';

import {useEffect, useState} from 'react';
import {BottomSheet} from '@/components/ui/BottomSheet';
import type {LibrarySort, VisibilityFilter} from './types';
import {
  FilterOptionList,
  type FilterPanelOption,
} from './WorkInternalFilterPanel';
import type {NestedFilterSection} from './NestedFilterMenu';

const SORT_OPTIONS: {value: LibrarySort; label: string}[] = [
  {value: 'publishedAt-desc', label: 'Newest first'},
  {value: 'publishedAt-asc', label: 'Oldest first'},
  {value: 'title-asc', label: 'Title A–Z'},
  {value: 'title-desc', label: 'Title Z–A'},
  {value: 'client-asc', label: 'Brand A–Z'},
  {value: 'client-desc', label: 'Brand Z–A'},
];

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
      <ul className="vp-internal-sheet__choice-list" role="listbox" aria-label="Sort">
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

interface AccordionSectionProps {
  section: NestedFilterSection;
  open: boolean;
  onToggle: () => void;
}

function AccordionSection({section, open, onToggle}: AccordionSectionProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered =
    query.trim()
      ? section.options.filter((opt) =>
          opt.label.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : section.options;

  return (
    <div
      className={
        open
          ? 'vp-internal-sheet__accordion is-open'
          : 'vp-internal-sheet__accordion'
      }
    >
      <button
        type="button"
        className={
          section.hasSelection
            ? 'vp-internal-sheet__accordion-btn has-selection'
            : 'vp-internal-sheet__accordion-btn'
        }
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>{section.label}</span>
        <span className="vp-internal-sheet__accordion-chevron" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open ? (
        <div className="vp-internal-sheet__accordion-body">
          {section.searchPlaceholder ? (
            <label className="vp-internal-fchip__search">
              <span className="sr-only">{section.searchPlaceholder}</span>
              <input
                type="search"
                className="vp-internal-fchip__search-input"
                placeholder={section.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          ) : null}
          <FilterOptionList
            options={filtered}
            selectedValue={section.selectedValue}
            onSelect={section.onSelect}
            emptyLabel={section.emptyLabel}
          />
        </div>
      ) : null}
    </div>
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
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [brandQuery, setBrandQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setOpenAccordion(null);
      setBrandQuery('');
    }
  }, [open]);

  const filteredBrands = brandQuery.trim()
    ? brandOptions.filter((opt) =>
        opt.label.toLowerCase().includes(brandQuery.trim().toLowerCase()),
      )
    : brandOptions;

  function toggleAccordion(id: string) {
    setOpenAccordion((prev) => (prev === id ? null : id));
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filters"
      closeAriaLabel="Close filters"
      bodyClassName="vp-internal-sheet__body"
      headerStart={
        hasActiveFilters ? (
          <button
            type="button"
            className="vp-internal-sheet__clear"
            onClick={onClear}
          >
            Clear
          </button>
        ) : undefined
      }
    >
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

      <div className="vp-internal-sheet__section">
        <h3 className="vp-internal-sheet__section-label">Categories</h3>
        {categorySections.map((section) => (
          <AccordionSection
            key={section.id}
            section={section}
            open={openAccordion === `cat-${section.id}`}
            onToggle={() => toggleAccordion(`cat-${section.id}`)}
          />
        ))}
      </div>

      <div className="vp-internal-sheet__section">
        <h3 className="vp-internal-sheet__section-label">Brands</h3>
        <label className="vp-internal-fchip__search">
          <span className="sr-only">Search brands</span>
          <input
            type="search"
            className="vp-internal-fchip__search-input"
            placeholder="Search brands…"
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
          />
        </label>
        <FilterOptionList
          options={filteredBrands}
          selectedValue={brandSelected}
          onSelect={onBrandSelect}
          emptyLabel={brandQuery.trim() ? 'No matching brands' : 'No brands'}
        />
      </div>

      <div className="vp-internal-sheet__section">
        <h3 className="vp-internal-sheet__section-label">Crew</h3>
        {crewSections.map((section) => (
          <AccordionSection
            key={section.id}
            section={section}
            open={openAccordion === `crew-${section.id}`}
            onToggle={() => toggleAccordion(`crew-${section.id}`)}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
