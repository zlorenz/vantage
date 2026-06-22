/**
 * FormSelect — native select with custom chevron and uppercase options.
 */

export interface FormSelectProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
