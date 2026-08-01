/**
 * FormCheckboxGroup — custom-styled checkbox list for campaign brief multi-selects.
 * Supports optional nested content under a specific option (e.g. "Other" text field).
 */

import type { ReactNode } from 'react';

export type FormCheckboxOption = string | { value: string; label: string };

export interface FormCheckboxGroupProps {
  name: string;
  values: string[];
  options: readonly FormCheckboxOption[];
  onToggle: (option: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  /** Rendered under the matching option when that option is checked. */
  optionExtra?: {
    value: string;
    content: ReactNode;
  };
}

function normalizeOption(option: FormCheckboxOption): { value: string; label: string } {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function FormCheckboxGroup({
  name,
  values,
  options,
  onToggle,
  disabled = false,
  hasError = false,
  optionExtra,
}: FormCheckboxGroupProps) {
  return (
    <div
      className={`vp-form-option-list${hasError ? ' vp-form-control--error' : ''}`}
      role="group"
    >
      {options.map((raw) => {
        const option = normalizeOption(raw);
        const id = `${name}-${option.value.replace(/\s+/g, '-').toLowerCase()}`;
        const checked = values.includes(option.value);
        const showExtra =
          optionExtra && optionExtra.value === option.value && checked;

        return (
          <div key={option.value} className="vp-form-checkbox-item">
            <label className="vp-form-checkbox" htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onToggle(option.value)}
                disabled={disabled}
              />
              <span className="vp-form-checkbox-box" aria-hidden="true" />
              <span className="vp-form-checkbox-label">{option.label}</span>
            </label>
            {showExtra && (
              <div className="vp-form-checkbox-extra">{optionExtra.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
