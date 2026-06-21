/**
 * LayoutShell — composes global site chrome around page content.
 *
 * Server component that wraps children with ContactModalProvider (client)
 * so interactive nav items can open the modal. SiteHeader and SiteFooter
 * are server components passed as siblings inside the provider boundary.
 */

import type { ReactNode } from 'react';
import type { NavPage, SiteSettings } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';
import { ContactModal } from './ContactModal';
import { ContactModalProvider } from './ContactModalContext';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

interface LayoutShellProps {
  locale: Locale;
  siteSettings: SiteSettings;
  navPages: NavPage[];
  children: ReactNode;
}

export function LayoutShell({
  locale,
  siteSettings,
  navPages,
  children,
}: LayoutShellProps) {
  return (
    <ContactModalProvider>
      <SiteHeader locale={locale} siteSettings={siteSettings} navPages={navPages} />
      <main id="main" className="site-main flex-1">
        {children}
      </main>
      <SiteFooter siteSettings={siteSettings} />
      <ContactModal siteSettings={siteSettings} />
    </ContactModalProvider>
  );
}
