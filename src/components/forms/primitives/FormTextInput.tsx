/**
 * FormTextInput — text, email, and tel inputs for the campaign brief form.
 */

export interface FormTextInputProps {
  id: string;
  name: string;
  type?: 'text' | 'email' | 'tel';
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

export function FormTextInput({
  id,
  name,
  type = 'text',
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder,
  autoComplete,
}: FormTextInputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      className={`vp-form-control${hasError ? ' vp-form-control--error' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
  );
}
