/**
 * Reusable filter chip + popover shell for /work-internal.
 *
 * Open/close is controlled by the parent (accordion: one panel at a time).
 * Escape / outside-click dismiss is owned by the parent wrapper so nested
 * panels share one listener.
 */

'use client';

import {useId, type ReactNode} from 'react';

export interface FilterPanelOption {
  value: string;
  label: string;
  /** Display-only indent depth (taxonomy children). */
  depth?: number;
  count: number;
  disabled: boolean;
}

interface WorkInternalFilterPanelProps {
  label: string;
  /** Active selection count shown as "Label (n)". */
  activeCount?: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Extra class on the panel surface. */
  panelClassName?: string;
}

export function WorkInternalFilterPanel({
  label,
  activeCount = 0,
  open,
  onToggle,
  children,
  panelClassName,
}: WorkInternalFilterPanelProps) {
  const panelId = useId();
  const chipLabel =
    activeCount > 0 ? `${label} (${activeCount})` : label;

  return (
    <div className="vp-internal-fchip">
      <button
        type="button"
        className={
          open || activeCount > 0
            ? 'vp-internal-fchip__btn is-active'
            : 'vp-internal-fchip__btn'
        }
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={onToggle}
      >
        <span className="vp-internal-fchip__label">{chipLabel}</span>
        <span className="vp-internal-fchip__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          className={
            panelClassName
              ? `vp-internal-fchip__panel ${panelClassName}`
              : 'vp-internal-fchip__panel'
          }
          role="dialog"
          aria-label={label}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

interface FilterActivePillProps {
  label: string;
  onRemove: () => void;
}

export function FilterActivePill({label, onRemove}: FilterActivePillProps) {
  return (
    <span className="vp-internal-fpill">
      <span className="vp-internal-fpill__text">{label}</span>
      <button
        type="button"
        className="vp-internal-fpill__remove"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
      >
        ×
      </button>
    </span>
  );
}

interface FilterOptionListProps {
  options: FilterPanelOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  emptyLabel?: string;
}

/** Single-select option list — clicking the active value clears it. */
export function FilterOptionList({
  options,
  selectedValue,
  onSelect,
  emptyLabel = 'No matches',
}: FilterOptionListProps) {
  if (options.length === 0) {
    return <p className="vp-internal-fchip__empty">{emptyLabel}</p>;
  }

  return (
    <ul className="vp-internal-fchip__list" role="listbox">
      {options.map((opt) => {
        const selected = opt.value === selectedValue;
        return (
          <li key={opt.value} role="none">
            <button
              type="button"
              role="option"
              aria-selected={selected}
              disabled={opt.disabled && !selected}
              className={
                selected
                  ? 'vp-internal-fchip__option is-selected'
                  : 'vp-internal-fchip__option'
              }
              style={
                opt.depth
                  ? {paddingLeft: `${0.65 + opt.depth * 0.75}rem`}
                  : undefined
              }
              onClick={() => onSelect(selected ? '' : opt.value)}
            >
              <span className="vp-internal-fchip__option-label">
                {opt.label}
              </span>
              <span className="vp-internal-fchip__option-count">
                {opt.count}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
