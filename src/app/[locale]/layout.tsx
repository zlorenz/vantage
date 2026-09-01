/**
 * Locale layout — primary layout shell for all public pages.
 *
 * Data flow:
 * 1. Validates [locale] and enables static rendering (setRequestLocale)
 * 2. Fetches siteSettings + nav page slugs once from Sanity (server-side)
 * 3. Passes CMS data to LayoutShell → SiteHeader, SiteFooter
 * 4. Wraps children in NextIntlClientProvider for client-side translations
 *
 * The <html lang> attribute is set here from the locale param so assistive
 * technology and search engines receive the correct document language.
 */

import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { GoogleTagManager } from '@next/third-parties/google';
import { draftMode, headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { VisualEditing } from 'next-sanity/visual-editing';
import { DisableDraftMode } from '@/components/visual-editing/DisableDraftMode';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { CjkOutlineFilter } from '@/components/layout/CjkOutlineFilter';
import { routing } from '@/i18n/routing';
import {
  monaSans,
  specialGothicExpandedOne,
  zalandoSansExpanded,
} from '@/lib/fonts';
import { METADATA_BASE } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import { SanityLive } from '@/sanity/lib/live';
import { NAV_PAGES_QUERY, SITE_SETTINGS_QUERY } from '@/sanity/queries/global';
import type { NavPage, SiteSettings } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  metadataBase: METADATA_BASE,
};

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  // Single server-side fetch for global layout data — no redundant per-page queries.
  const [siteSettings, navPages] = await Promise.all([
    sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
    sanityClient.fetch<NavPage[]>(NAV_PAGES_QUERY),
  ]);

  if (!siteSettings) {
    throw new Error('siteSettings document missing from Sanity dataset.');
  }

  const host = (await headers()).get('host') ?? '';
  // Sanity Live EventSource isn't CORS-allowlisted for LAN IPs and retries
  // every 1s, which floods the terminal during phone-on-LAN preview.
  const enableSanityLive =
    process.env.NODE_ENV !== 'development' ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1');

  return (
    <html
      lang={locale}
      className={`h-full ${monaSans.variable} ${specialGothicExpandedOne.variable} ${zalandoSansExpanded.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-vp-bg font-vp-sans text-vp-text">
        <CjkOutlineFilter />
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LayoutShell
            locale={locale as Locale}
            siteSettings={siteSettings}
            navPages={navPages}
          >
            {children}
          </LayoutShell>
        </NextIntlClientProvider>
        {enableSanityLive ? <SanityLive /> : null}
        {(await draftMode()).isEnabled && (
          <>
            <VisualEditing />
            <DisableDraftMode />
          </>
        )}
      </body>
    </html>
  );
}
