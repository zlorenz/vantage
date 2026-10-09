/**
 * LayoutChrome — client gate for sitewide marketing chrome.
 *
 * Locale layouts are shared and cached across sibling routes, so a server-only
 * pathname check would not update on client navigations. usePathname keeps
 * SiteHeader / SiteFooter in sync when entering/leaving internal app routes.
 * `onAppHost` comes from the request Host header so SSR matches the app host
 * (browser path is `/`, not `/work-internal`).
 */

'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import { isInternalAppChromePath } from '@/lib/internal-app-paths';
import '@/components/work-internal/work-internal-theme.css';

interface LayoutChromeProps {
  /** True when the request Host is the app subdomain (incl. app.localhost). */
  onAppHost?: boolean;
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
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

export function LayoutChrome({
  onAppHost = false,
  header,
  footer,
  children,
}: LayoutChromeProps) {
  const pathname = usePathname();
  const useInternalChrome =
    onAppHost || isInternalAppChromePath(pathname);

  return (
    <>
      {useInternalChrome ? null : header}
      <main id="main" className="site-main flex-1">
        {children}
      </main>
      {useInternalChrome ? <WorkInternalFooter /> : footer}
    </>
  );
}
