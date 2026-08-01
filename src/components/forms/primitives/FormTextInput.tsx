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
  className?: string;
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
  className = '',
}: FormTextInputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      className={`vp-form-control${hasError ? ' vp-form-control--error' : ''}${className ? ` ${className}` : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
  );
}
