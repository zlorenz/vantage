/**
 * Work Internal — internal portfolio library app (noindex).
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { WorkInternalApp } from '@/components/work-internal/WorkInternalApp';
import { routing, type Locale } from '@/i18n/routing';
import { sanityClient } from '@/lib/sanity';
import {
  ALL_CLIENTS_QUERY,
  CREW_MEMBERS_BY_ROLE_QUERY,
  INDUSTRIES_QUERY,
  INTERNAL_LIBRARY_QUERY,
  MARKETS_QUERY,
  VIDEO_FORMATS_QUERY,
} from '@/sanity/queries/portfolio';
import type {
  ClientTerm,
  CrewMemberTerm,
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

  const [
    entries,
    clients,
    directors,
    dops,
    artDirectors,
    videoFormats,
    industries,
    markets,
  ] = await Promise.all([
    sanityClient.fetch<InternalLibraryEntry[]>(INTERNAL_LIBRARY_QUERY),
    sanityClient.fetch<ClientTerm[]>(ALL_CLIENTS_QUERY),
    sanityClient.fetch<CrewMemberTerm[]>(CREW_MEMBERS_BY_ROLE_QUERY, {
      role: 'director',
    }),
    sanityClient.fetch<CrewMemberTerm[]>(CREW_MEMBERS_BY_ROLE_QUERY, {
      role: 'dop',
    }),
    sanityClient.fetch<CrewMemberTerm[]>(CREW_MEMBERS_BY_ROLE_QUERY, {
      role: 'art-director',
    }),
    sanityClient.fetch<TaxonomyTerm[]>(VIDEO_FORMATS_QUERY),
    sanityClient.fetch<TaxonomyTerm[]>(INDUSTRIES_QUERY),
    sanityClient.fetch<TaxonomyTerm[]>(MARKETS_QUERY),
  ]);

  return (
    <div className="vp-internal-page">
      <Suspense fallback={<div className="vp-load-spinner" />}>
        <WorkInternalApp
          locale={typedLocale}
          entries={entries}
          clients={clients}
          directors={directors}
          dops={dops}
          artDirectors={artDirectors}
          videoFormats={videoFormats}
          industries={industries}
          markets={markets}
        />
      </Suspense>
    </div>
  );
}
