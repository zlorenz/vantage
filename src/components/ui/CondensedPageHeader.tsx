/**
 * CondensedPageHeader — top spacing for pages without a hero image.
 *
 * Server component. Used when showHeroHeader is false (Home, Campaign Brief).
 * Adds padding so content clears the fixed navbar.
 */

interface CondensedPageHeaderProps {
  children?: React.ReactNode;
}

export function CondensedPageHeader({ children }: CondensedPageHeaderProps) {
  return (
    <div className="vp-condensed-header pt-[var(--vp-section-y-header-condensed)]">
      {children}
    </div>
  );
}
