/**
 * Contact page — opens the global ContactModal on mount.
 */

import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { ContactPageClient } from './ContactPageClient';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ContactPageClient />;
}
