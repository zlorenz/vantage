/**
 * FormSelect — native select with custom chevron and uppercase options.
 */

export type FormSelectOption = string | { value: string; label: string };

export interface FormSelectProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly FormSelectOption[];
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
}

function normalizeOption(option: FormSelectOption): { value: string; label: string } {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function FormSelect({
  id,
  name,
  value,
  onChange,
  options,
  disabled = false,
  hasError = false,
  placeholder = 'Select…',
}: FormSelectProps) {
  return (
    <div className="vp-form-select-wrap">
      <select
        id={id}
        name={name}
        className={`vp-form-control vp-form-select${hasError ? ' vp-form-control--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((raw) => {
          const option = normalizeOption(raw);
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
