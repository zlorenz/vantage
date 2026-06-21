/**
 * Root layout — pass-through shell for routes outside [locale] (e.g. /api).
 *
 * Locale-specific <html>/<body>, global styles, and site chrome live in
 * app/[locale]/layout.tsx where the lang attribute is set from the locale.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vantage Pictures',
  description: 'Commercial film production company',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
