/**
 * Prototype-only featured-work carousel route.
 * Not linked from the live homepage. Noindex.
 */

import type {Metadata} from 'next';
import {setRequestLocale} from 'next-intl/server';
import {FeaturedWorkCarousel} from '@/components/prototype/carousel/FeaturedWorkCarousel';
import {loadFeaturedWorkSlides} from '@/components/prototype/carousel/load-slides';
import {routing, type Locale} from '@/i18n/routing';

type Props = {
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export const metadata: Metadata = {
  title: 'Prototype Carousel | Vantage Pictures',
  robots: {index: false, follow: false},
};

export default async function PrototypeCarouselPage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);
  const slides = await loadFeaturedWorkSlides(locale as Locale);
  return <FeaturedWorkCarousel slides={slides} />;
}
