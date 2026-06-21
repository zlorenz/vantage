/**
 * Root layout — html/body shell shared by all routes (including /api).
 * Locale-specific providers live in app/[locale]/layout.tsx.
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vantage Pictures',
  description: 'Commercial film production company',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
