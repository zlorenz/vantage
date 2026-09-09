/**
 * Bulk-select checkbox for work-internal cards/rows.
 * Click stops propagation so opening the portfolio entry is unaffected.
 */

'use client';

interface WorkInternalSelectCheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function WorkInternalSelectCheckbox({
  checked,
  label,
  onChange,
}: WorkInternalSelectCheckboxProps) {
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
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="vp-internal-select__box" aria-hidden="true" />
    </label>
  );
}
