/**
 * Work Internal — internal portfolio library app (noindex).
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { WorkInternalApp } from '@/components/work-internal/WorkInternalApp';
import { routing, type Locale } from '@/i18n/routing';
import { sanityFetch } from '@/sanity/lib/live';
import {
  INDUSTRIES_QUERY,
  INTERNAL_LIBRARY_QUERY,
  MARKETS_QUERY,
  VIDEO_FORMATS_QUERY,
} from '@/sanity/queries/portfolio';
import type {
  InternalLibraryEntry,
  TaxonomyTerm,
} from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Work Library | Vantage Pictures',
  robots: { index: false, follow: false },
};

export default async function WorkInternalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [entriesResult, videoFormatsResult, industriesResult, marketsResult] =
    await Promise.all([
      sanityFetch({query: INTERNAL_LIBRARY_QUERY, stega: false}),
      sanityFetch({query: VIDEO_FORMATS_QUERY, stega: false}),
      sanityFetch({query: INDUSTRIES_QUERY, stega: false}),
      sanityFetch({query: MARKETS_QUERY, stega: false}),
    ]);
  const entries = entriesResult.data as InternalLibraryEntry[];
  const videoFormats = videoFormatsResult.data as TaxonomyTerm[];
  const industries = industriesResult.data as TaxonomyTerm[];
  const markets = marketsResult.data as TaxonomyTerm[];

  return (
    <div className="vp-internal-page">
      <Suspense fallback={<div className="vp-load-spinner" />}>
        <WorkInternalApp
          locale={typedLocale}
          entries={entries}
          videoFormats={videoFormats}
          industries={industries}
          markets={markets}
        />
      </Suspense>
    </div>
  );
}
