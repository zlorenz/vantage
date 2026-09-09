/**
 * Nested filter menu: root items with hover/focus flyouts to the right.
 * Used by Categories (Format / Industry / Market) and Crew (roles → names).
 */

'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {
  FilterOptionList,
  type FilterPanelOption,
} from './WorkInternalFilterPanel';

export interface NestedFilterSection {
  id: string;
  label: string;
  /** True when this section has an active filter selection. */
  hasSelection: boolean;
  options: FilterPanelOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  searchPlaceholder?: string;
  emptyLabel?: string;
}

interface NestedFilterMenuProps {
  sections: NestedFilterSection[];
  /** Accessible name for the root list. */
  rootLabel: string;
}

export function NestedFilterMenu({
  sections,
  rootLabel,
}: NestedFilterMenuProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyoutId = useId();

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    setQuery('');
  }, [openId]);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  }

  function openSection(id: string) {
    cancelClose();
    setOpenId(id);
  }

  const openSectionData = sections.find((s) => s.id === openId) ?? null;
  const filteredOptions =
    openSectionData && query.trim()
      ? openSectionData.options.filter((opt) =>
          opt.label.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : (openSectionData?.options ?? []);

  return (
    <div
      className="vp-internal-fnest"
      onMouseLeave={scheduleClose}
      onMouseEnter={cancelClose}
    >
      <ul className="vp-internal-fnest__roots" role="menu" aria-label={rootLabel}>
        {sections.map((section) => {
          const isOpen = openId === section.id;
          return (
            <li
              key={section.id}
              className={
                isOpen
                  ? 'vp-internal-fnest__root is-open'
                  : 'vp-internal-fnest__root'
              }
              role="none"
              onMouseEnter={() => openSection(section.id)}
            >
              <button
                type="button"
                role="menuitem"
                className={
                  section.hasSelection
                    ? 'vp-internal-fnest__root-btn has-selection'
                    : 'vp-internal-fnest__root-btn'
                }
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={isOpen ? flyoutId : undefined}
                onClick={() =>
                  setOpenId((prev) => (prev === section.id ? null : section.id))
                }
                onFocus={() => openSection(section.id)}
              >
                <span className="vp-internal-fnest__root-label">
                  {section.label}
                </span>
                {section.hasSelection ? (
                  <span
                    className="vp-internal-fnest__root-dot"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="vp-internal-fnest__root-chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {openSectionData ? (
        <div
          id={flyoutId}
          className="vp-internal-fnest__flyout"
          role="menu"
          aria-label={openSectionData.label}
          onMouseEnter={cancelClose}
        >
          {openSectionData.searchPlaceholder ? (
            <label className="vp-internal-fchip__search">
              <span className="sr-only">{openSectionData.searchPlaceholder}</span>
              <input
                type="search"
                className="vp-internal-fchip__search-input"
                placeholder={openSectionData.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          ) : null}
          <div className="vp-internal-fnest__flyout-body">
            <FilterOptionList
              options={filteredOptions}
              selectedValue={openSectionData.selectedValue}
              onSelect={openSectionData.onSelect}
              emptyLabel={
                query.trim()
                  ? 'No matches'
                  : (openSectionData.emptyLabel ?? 'No options')
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
