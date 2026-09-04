/**
 * Prototype-only footer lens route.
 * Not linked from the live homepage. Noindex.
 */

import type {Metadata} from 'next';
import {setRequestLocale} from 'next-intl/server';
import {FooterLensPrototype} from '@/components/prototype/footer-lens/FooterLensPrototype';
import {routing} from '@/i18n/routing';

type Props = {
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export const metadata: Metadata = {
  title: 'Prototype Footer Lens | Vantage Pictures',
  robots: {index: false, follow: false},
};

export default async function PrototypeFooterLensPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <FooterLensPrototype />;
}
