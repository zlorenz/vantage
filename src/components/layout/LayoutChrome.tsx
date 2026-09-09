/**
 * LayoutChrome — client gate for sitewide marketing chrome.
 *
 * Locale layouts are shared and cached across sibling routes, so a server-only
 * pathname check would not update on client navigations. usePathname keeps
 * SiteHeader / SiteFooter in sync when entering/leaving /work-internal.
 */

'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import '@/components/work-internal/work-internal-theme.css';

interface LayoutChromeProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

function isWorkInternalPath(pathname: string): boolean {
  return pathname === '/work-internal';
}

function WorkInternalFooter() {
  return (
    <footer className="vp-internal-footer">
      <div className="vp-internal-footer__inner">
        <span className="vp-internal-footer__mark">Work Library</span>
        <span className="vp-internal-footer__mark">Internal</span>
      </div>
    </footer>
  );
}

export function LayoutChrome({ header, footer, children }: LayoutChromeProps) {
  const pathname = usePathname();
  const isWorkInternal = isWorkInternalPath(pathname);

  return (
    <>
      {isWorkInternal ? null : header}
      <main id="main" className="site-main flex-1">
        {children}
      </main>
      {isWorkInternal ? <WorkInternalFooter /> : footer}
    </>
  );
}
