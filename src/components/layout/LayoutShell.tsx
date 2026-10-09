/**
 * LayoutShell — composes global site chrome around page content.
 *
 * Server component. SiteHeader and SiteFooter are server components
 * passed into LayoutChrome (client) so internal app routes
 * (/work-internal, showreel editor/login) can hide marketing chrome.
 * Contact is a normal /contact route now — no modal provider/mount here.
 */

import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import type { NavPage, SiteSettings } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';
import { hostnameFromHostHeader, isAppHostname } from '@/lib/site-hosts';
import { RouteTransitionOverlay } from '@/components/navigation/RouteTransitionOverlay';
import { LayoutChrome } from './LayoutChrome';
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
  const host = hostnameFromHostHeader((await headers()).get('host'));
  const onAppHost = isAppHostname(host);

  return (
    <>
      <RouteTransitionOverlay />
      <LayoutChrome
        onAppHost={onAppHost}
        header={
          <SiteHeader
            locale={locale}
            siteSettings={siteSettings}
            navPages={navPages}
          />
        }
        footer={<SiteFooter siteSettings={siteSettings} />}
      >
        {children}
      </LayoutChrome>
    </>
  );
}
