/**
 * FormTextarea — multi-line input for campaign brief form fields.
 */

export interface FormTextareaProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  rows?: number;
}

export function FormTextarea({
  id,
  name,
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder,
  rows = 5,
}: FormTextareaProps) {
  return (
    <textarea
      id={id}
      name={name}
      className={`vp-form-control vp-form-textarea${hasError ? ' vp-form-control--error' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      rows={rows}
    />
  );
}
