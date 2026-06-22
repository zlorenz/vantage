/**
 * FormCheckboxGroup — custom-styled checkbox list for deliverables field.
 */

export interface FormCheckboxGroupProps {
  name: string;
  values: string[];
  options: readonly string[];
  onToggle: (option: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function FormCheckboxGroup({
  name,
  values,
  options,
  onToggle,
  disabled = false,
  hasError = false,
}: FormCheckboxGroupProps) {
  return (
    <div
      className={`vp-form-option-list${hasError ? ' vp-form-control--error' : ''}`}
      role="group"
    >
      {options.map((option) => {
        const id = `${name}-${option.replace(/\s+/g, '-').toLowerCase()}`;
        const checked = values.includes(option);
        return (
          <label key={option} className="vp-form-checkbox" htmlFor={id}>
            <input
              id={id}
              type="checkbox"
              name={name}
              value={option}
              checked={checked}
              onChange={() => onToggle(option)}
              disabled={disabled}
            />
            <span className="vp-form-checkbox-box" aria-hidden="true" />
            <span className="vp-form-checkbox-label">{option}</span>
          </label>
        );
      })}
    </div>
  );
}
