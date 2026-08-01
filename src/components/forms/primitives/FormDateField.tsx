/**
 * FormDateField — native date input with "I don't have a specific date yet"
 * checkbox. Checking the box swaps the date input in-place for a text field
 * (same slot / no layout shift) with a placeholder for rough timeframe.
 */

import { FormTextInput } from '@/components/forms/primitives/FormTextInput';

export interface FormDateFieldProps {
  id: string;
  name: string;
  dateValue: string;
  unknown: boolean;
  noteValue: string;
  onDateChange: (value: string) => void;
  onUnknownChange: (unknown: boolean) => void;
  onNoteChange: (value: string) => void;
  unknownLabel: string;
  notePlaceholder: string;
  disabled?: boolean;
  hasError?: boolean;
}

export function FormDateField({
  id,
  name,
  dateValue,
  unknown,
  noteValue,
  onDateChange,
  onUnknownChange,
  onNoteChange,
  unknownLabel,
  notePlaceholder,
  disabled = false,
  hasError = false,
}: FormDateFieldProps) {
  const unknownId = `${id}_unknown`;

  return (
    <div className="vp-form-date-field">
      {unknown ? (
        <FormTextInput
          id={id}
          name={`${name}_note`}
          value={noteValue}
          onChange={onNoteChange}
          disabled={disabled}
          hasError={hasError}
          placeholder={notePlaceholder}
        />
      ) : (
        <input
          id={id}
          name={name}
          type="date"
          className={`vp-form-control vp-form-control--date${hasError ? ' vp-form-control--error' : ''}`}
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          disabled={disabled}
        />
      )}

      <label className="vp-form-checkbox vp-form-date-unknown" htmlFor={unknownId}>
        <input
          id={unknownId}
          type="checkbox"
          name={`${name}_unknown`}
          checked={unknown}
          onChange={(e) => {
            const checked = e.target.checked;
            onUnknownChange(checked);
            if (checked) onDateChange('');
            else onNoteChange('');
          }}
          disabled={disabled}
        />
        <span className="vp-form-checkbox-box" aria-hidden="true" />
        <span className="vp-form-checkbox-label">{unknownLabel}</span>
      </label>
    </div>
  );
}
