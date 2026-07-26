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
import { workPageTitle, buildOgImage, buildPageMetadata, seoDescription } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import { getPhraseRecord } from '@/lib/phrase-book';
import { buildBreadcrumbs, homeBreadcrumb, workBreadcrumb } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { WORK_PAGE_META_QUERY } from '@/sanity/queries/pages';
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
} from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const workPageDoc = await sanityClient.fetch(WORK_PAGE_META_QUERY);

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/work',
    zhPath: '/zh/工作',
    title: workPageTitle(typedLocale),
    description: seoDescription(workPageDoc?.seo ?? undefined, typedLocale),
    image: buildOgImage(workPageDoc?.featuredImage ?? undefined),
    type: 'website',
  });
}

export default async function WorkPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [workPage, entries, videoFormats, industries, markets, phrases] =
    await Promise.all([
      sanityClient.fetch(WORK_PAGE_QUERY),
      sanityClient.fetch<PortfolioGridEntry[]>(ALL_PORTFOLIO_QUERY),
      sanityClient.fetch<TaxonomyTerm[]>(VIDEO_FORMATS_QUERY),
      sanityClient.fetch<TaxonomyTerm[]>(INDUSTRIES_QUERY),
      sanityClient.fetch<TaxonomyTerm[]>(MARKETS_QUERY),
      getPhraseRecord(),
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
      <JsonLd
        data={buildBreadcrumbs([homeBreadcrumb(typedLocale), workBreadcrumb(typedLocale)])}
      />
      <PageHero title={heroTitle} backgroundImage={workPage?.featuredImage ?? undefined} />
      <SectionWrapper>
        <div className="container-fluid px-3 md:px-4">
          {introBlocks?.length ? (
            <div className="vp-work-intro container mx-auto mb-8 text-center font-light text-vp-text-muted min-[1400px]:max-w-[1320px]">
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
              phrases={phrases}
            />
          </Suspense>
        </div>
      </SectionWrapper>
    </>
  );
}
