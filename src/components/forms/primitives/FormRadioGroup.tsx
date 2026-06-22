/**
 * FormRadioGroup — custom-styled radio button list for campaign brief form.
 */

export interface FormRadioGroupProps {
  name: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
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
      {options.map((option) => {
        const id = `${name}-${option.replace(/\s+/g, '-').toLowerCase()}`;
        return (
          <label key={option} className="vp-form-radio" htmlFor={id}>
            <input
              id={id}
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              disabled={disabled}
            />
            <span className="vp-form-radio-box" aria-hidden="true" />
            <span className="vp-form-radio-label">{option}</span>
          </label>
        );
      })}
    </div>
  );
}
