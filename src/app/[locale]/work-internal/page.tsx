/**
 * Work Internal page — full portfolio grid with crew filters (includes hidden entries).
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/ui/PageHero';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';
import { routing, type Locale } from '@/i18n/routing';
import { workPageTitle } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import {
  ALL_CLIENTS_QUERY,
  ALL_PORTFOLIO_INTERNAL_QUERY,
  CREW_MEMBERS_BY_ROLE_QUERY,
  WORK_PAGE_QUERY,
} from '@/sanity/queries/portfolio';
import type {
  ClientTerm,
  CrewMemberTerm,
  PortfolioInternalGridEntry,
  WorkPage,
} from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: workPageTitle(),
  robots: { index: false, follow: false },
};

export default async function WorkInternalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [workPage, entries, clients, directors, dops, artDirectors] =
    await Promise.all([
      sanityClient.fetch<WorkPage | null>(WORK_PAGE_QUERY),
      sanityClient.fetch<PortfolioInternalGridEntry[]>(
        ALL_PORTFOLIO_INTERNAL_QUERY,
      ),
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
    ]);

  const heroTitle =
    typedLocale === 'zh' && workPage?.heroTitleZh
      ? workPage.heroTitleZh
      : workPage?.heroTitle || 'Work Internal';

  return (
    <>
      <PageHero title={heroTitle} backgroundImage={workPage?.featuredImage} />
      <SectionWrapper>
        <div className="container-fluid px-3 md:px-4">
          <Suspense fallback={<div className="vp-load-spinner" />}>
            <PortfolioGrid
              locale={typedLocale}
              entries={entries}
              filterMode="internal"
              clients={clients}
              directors={directors}
              dops={dops}
              artDirectors={artDirectors}
            />
          </Suspense>
        </div>
      </SectionWrapper>
    </>
  );
}
