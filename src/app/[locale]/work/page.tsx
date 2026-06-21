/**
 * Work index page — hero, intro, and filterable portfolio grid.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextIntro } from '@/components/ui/PortableTextIntro';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';
import { routing, type Locale } from '@/i18n/routing';
import { workPageTitle } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import {
  ALL_PORTFOLIO_QUERY,
  INDUSTRIES_QUERY,
  MARKETS_QUERY,
  VIDEO_FORMATS_QUERY,
  WORK_PAGE_QUERY,
} from '@/sanity/queries/portfolio';
import type {
  PortfolioGridEntry,
  TaxonomyTerm,
  WorkPage,
} from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: workPageTitle(),
    alternates: {
      languages: {
        en: '/work',
        zh: '/zh/作品',
      },
    },
  };
}

export default async function WorkPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [workPage, entries, videoFormats, industries, markets] =
    await Promise.all([
      sanityClient.fetch<WorkPage | null>(WORK_PAGE_QUERY),
      sanityClient.fetch<PortfolioGridEntry[]>(ALL_PORTFOLIO_QUERY),
      sanityClient.fetch<TaxonomyTerm[]>(VIDEO_FORMATS_QUERY),
      sanityClient.fetch<TaxonomyTerm[]>(INDUSTRIES_QUERY),
      sanityClient.fetch<TaxonomyTerm[]>(MARKETS_QUERY),
    ]);

  const heroTitle =
    typedLocale === 'zh' && workPage?.heroTitleZh
      ? workPage.heroTitleZh
      : workPage?.heroTitle || workPage?.title || 'Work';

  const introBlocks =
    typedLocale === 'zh' && workPage?.bodyZh?.length
      ? workPage.bodyZh
      : workPage?.body;

  return (
    <>
      <PageHero title={heroTitle} backgroundImage={workPage?.featuredImage} />
      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          {introBlocks?.length ? (
            <div className="vp-work-intro mx-auto mb-8 max-w-[900px] text-center font-light text-vp-text-muted">
              <PortableTextIntro blocks={introBlocks} />
            </div>
          ) : null}
          <Suspense fallback={<div className="vp-load-spinner" />}>
            <PortfolioGrid
              locale={typedLocale}
              entries={entries}
              filterMode="public"
              videoFormats={videoFormats}
              industries={industries}
              markets={markets}
            />
          </Suspense>
        </div>
      </SectionWrapper>
    </>
  );
}
