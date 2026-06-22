/**
 * FormSectionHeader — uppercase section divider within a form step.
 */

export interface FormSectionHeaderProps {
  title: string;
}

export function FormSectionHeader({ title }: FormSectionHeaderProps) {
  return <h3 className="vp-form-section-header">{title}</h3>;
}
