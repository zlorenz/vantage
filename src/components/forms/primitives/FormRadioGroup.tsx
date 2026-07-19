/**
 * FormRadioGroup — custom-styled radio button list for campaign brief form.
 */

export type FormRadioOption = string | { value: string; label: string };

export interface FormRadioGroupProps {
  name: string;
  value: string;
  options: readonly FormRadioOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

function normalizeOption(option: FormRadioOption): { value: string; label: string } {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function FormRadioGroup({
  name,
  value,
  options,
  onChange,
  disabled = false,
  hasError = false,
}: FormRadioGroupProps) {
  return (
    <div
      className={`vp-form-option-list${hasError ? ' vp-form-control--error' : ''}`}
      role="radiogroup"
    >
      {options.map((raw) => {
        const option = normalizeOption(raw);
        const id = `${name}-${option.value.replace(/\s+/g, '-').toLowerCase()}`;
        return (
          <label key={option.value} className="vp-form-radio" htmlFor={id}>
            <input
              id={id}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
            />
            <span className="vp-form-radio-box" aria-hidden="true" />
            <span className="vp-form-radio-label">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
