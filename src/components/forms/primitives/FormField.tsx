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
  /** Place hint directly under the label (used for radio/checkbox groups). */
  hintBeforeControls?: boolean;
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
  hintBeforeControls = false,
  fullWidth = false,
  className = '',
  children,
}: FormFieldProps) {
  const spanClass = fullWidth ? 'vp-form-col-span-2' : '';
  const hintEl =
    hint && !error ? (
      <p className={`vp-field-hint${hintBeforeControls ? ' vp-field-hint--before' : ''}`}>
        {hint}
      </p>
    ) : null;

  return (
    <div className={`vp-form-field ${spanClass} ${className}`.trim()}>
      <label className="vp-form-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="vp-form-label-required"> *</span>}
      </label>
      {hintBeforeControls && hintEl}
      {children}
      {!hintBeforeControls && hintEl}
      {helper && !error && <p className="vp-form-helper">{helper}</p>}
      {error && <p className="vp-form-error-msg">{error}</p>}
    </div>
  );
}
