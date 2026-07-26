/**
 * Locale layout — primary layout shell for all public pages.
 *
 * Data flow:
 * 1. Validates [locale] and enables static rendering (setRequestLocale)
 * 2. Fetches siteSettings + nav page slugs once from Sanity (server-side)
 * 3. Passes CMS data to LayoutShell → SiteHeader, SiteFooter, ContactModal
 * 4. Wraps children in NextIntlClientProvider for client-side translations
 *
 * The <html lang> attribute is set here from the locale param so assistive
 * technology and search engines receive the correct document language.
 */

import '../globals.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { routing } from '@/i18n/routing';
import { nunito, poppins } from '@/lib/fonts';
import { METADATA_BASE } from '@/lib/metadata';
import { getPhraseRecord } from '@/lib/phrase-book';
import { sanityClient } from '@/lib/sanity';
import { NAV_PAGES_QUERY, SITE_SETTINGS_QUERY } from '@/sanity/queries/global';
import type { NavPage, SiteSettings } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  metadataBase: METADATA_BASE,
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
  const [siteSettings, navPages, phrases] = await Promise.all([
    sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
    sanityClient.fetch<NavPage[]>(NAV_PAGES_QUERY),
    getPhraseRecord(),
  ]);

  if (!siteSettings) {
    throw new Error('siteSettings document missing from Sanity dataset.');
  }

  return (
    <html
      lang={locale}
      className={`h-full ${poppins.variable} ${nunito.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-vp-bg font-vp-sans text-vp-text">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LayoutShell
            locale={locale as Locale}
            siteSettings={siteSettings}
            navPages={navPages}
            phrases={phrases}
          >
            {children}
          </LayoutShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
