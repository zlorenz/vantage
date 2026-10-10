/**
 * Bulk-select checkbox for work-internal cards/rows.
 * Click stops propagation so opening the portfolio entry is unaffected.
 * Shift+click is handled by the parent (range select over the visible list).
 */

'use client';

import type {KeyboardEvent, MouseEvent} from 'react';

interface WorkInternalSelectCheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean, shiftKey: boolean) => void;
}

export function WorkInternalSelectCheckbox({
  checked,
  label,
  onChange,
}: WorkInternalSelectCheckboxProps) {
  function commit(next: boolean, shiftKey: boolean) {
    onChange(next, shiftKey);
  }

  function onInputClick(event: MouseEvent<HTMLInputElement>) {
    event.stopPropagation();
    // Controlled input: prevent the native toggle and drive state ourselves so
    // shiftKey is available (change events are not always MouseEvents).
    event.preventDefault();
    commit(!checked, event.shiftKey);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation();
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    commit(!checked, event.shiftKey);
  }

  return (
    <label
      className={
        checked
          ? 'vp-internal-select is-checked'
          : 'vp-internal-select'
      }
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="vp-internal-select__input"
        checked={checked}
        aria-label={label}
        onClick={onInputClick}
        onKeyDown={onInputKeyDown}
        onChange={() => {
          // Controlled via click/keydown handlers above.
        }}
      />
      <span className="vp-internal-select__box" aria-hidden="true" />
    </label>
  );
}
