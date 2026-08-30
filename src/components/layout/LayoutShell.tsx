/**
 * LayoutShell — composes global site chrome around page content.
 *
 * Server component. SiteHeader and SiteFooter are server components
 * rendered as siblings around the page content. Contact is a normal
 * /contact route now — no modal provider/mount here anymore.
 */

import type { ReactNode } from 'react';
import type { NavPage, SiteSettings } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';
import { RouteTransitionOverlay } from '@/components/navigation/RouteTransitionOverlay';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

interface LayoutShellProps {
  locale: Locale;
  siteSettings: SiteSettings;
  navPages: NavPage[];
  children: ReactNode;
}

export async function LayoutShell({
  locale,
  siteSettings,
  navPages,
  children,
}: LayoutShellProps) {
  return (
    <>
      <RouteTransitionOverlay />
      <SiteHeader locale={locale} siteSettings={siteSettings} navPages={navPages} />
      <main id="main" className="site-main flex-1">
        {children}
      </main>
      <SiteFooter siteSettings={siteSettings} />
    </>
  );
}
