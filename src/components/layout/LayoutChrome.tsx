/**
 * LayoutChrome — client gate for sitewide marketing chrome.
 *
 * Locale layouts are shared and cached across sibling routes, so a server-only
 * pathname check would not update on client navigations. usePathname keeps
 * SiteHeader in sync when entering/leaving /work-internal.
 */

'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';

interface LayoutChromeProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

function isWorkInternalPath(pathname: string): boolean {
  return pathname === '/work-internal';
}

export function LayoutChrome({ header, footer, children }: LayoutChromeProps) {
  const pathname = usePathname();
  const hideMarketingHeader = isWorkInternalPath(pathname);

  return (
    <>
      {hideMarketingHeader ? null : header}
      <main id="main" className="site-main flex-1">
        {children}
      </main>
      {footer}
    </>
  );
}
