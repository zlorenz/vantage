/**
 * SectionWrapper — vertical section padding with optional variants.
 *
 * Server component. Wraps content blocks with consistent section spacing.
 */

interface SectionWrapperProps {
  children: React.ReactNode;
  /** tight | loose — default is standard section padding */
  variant?: 'default' | 'tight' | 'loose';
  borderTop?: boolean;
  className?: string;
}

const PADDING = {
  default: 'py-[var(--vp-section-y)]',
  tight: 'py-[var(--vp-section-y-tight)]',
  loose: 'py-[var(--vp-section-y-loose)]',
} as const;

export function SectionWrapper({
  children,
  variant = 'default',
  borderTop = false,
  className = '',
}: SectionWrapperProps) {
  return (
    <section
      className={`vp-section ${PADDING[variant]}${borderTop ? ' border-t border-vp-border-soft' : ''} ${className}`.trim()}
    >
      {children}
    </section>
  );
}
