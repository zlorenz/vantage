/**
 * FormField — label, helper text, and error message wrapper for campaign brief inputs.
 */

import type { ReactNode } from 'react';

export type FormFieldColSpan = 'full' | 'half' | 'third';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  helper?: string;
  colSpan?: FormFieldColSpan;
  className?: string;
  children: ReactNode;
}

const COL_SPAN_CLASS: Record<FormFieldColSpan, string> = {
  full: 'vp-form-field--full',
  half: 'vp-form-field--half',
  third: 'vp-form-field--third',
};

export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  helper,
  colSpan = 'full',
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`vp-form-field ${COL_SPAN_CLASS[colSpan]} ${className}`.trim()}>
      <label className="vp-form-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="vp-form-label-required"> *</span>}
      </label>
      {children}
      {helper && !error && <p className="vp-form-helper">{helper}</p>}
      {error && <p className="vp-form-error-msg">{error}</p>}
    </div>
  );
}
