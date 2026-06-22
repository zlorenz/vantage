/**
 * FormField — label, hint, helper text, and error message wrapper for campaign brief inputs.
 */

import type { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  helper?: string;
  hint?: string;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  helper,
  hint,
  fullWidth = false,
  className = '',
  children,
}: FormFieldProps) {
  const spanClass = fullWidth ? 'vp-form-col-span-2' : '';

  return (
    <div className={`vp-form-field ${spanClass} ${className}`.trim()}>
      <label className="vp-form-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="vp-form-label-required"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="vp-field-hint">{hint}</p>}
      {helper && !error && <p className="vp-form-helper">{helper}</p>}
      {error && <p className="vp-form-error-msg">{error}</p>}
    </div>
  );
}
