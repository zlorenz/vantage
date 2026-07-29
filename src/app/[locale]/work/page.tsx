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
import { workPageTitle, resolveMetadataImage, buildPageMetadata, seoDescription, seoMetaTitle } from '@/lib/metadata';
import { getPhraseRecord } from '@/lib/phrase-book';
import { buildBreadcrumbs, homeBreadcrumb, workBreadcrumb } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { sanityFetch } from '@/sanity/lib/live';
import { WORK_PAGE_META_QUERY } from '@/sanity/queries/pages';
import {
  ALL_PORTFOLIO_QUERY,
  INDUSTRIES_QUERY,
  MARKETS_QUERY,
  VIDEO_FORMATS_QUERY,
  WORK_PAGE_QUERY,
} from '@/sanity/queries/portfolio';
import type {
  WORK_PAGE_META_QUERY_RESULT,
  WORK_PAGE_QUERY_RESULT,
} from '@/sanity/sanity.types';
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
  const {data} = await sanityFetch({query: WORK_PAGE_META_QUERY, stega: false});
  const workPageDoc = data as WORK_PAGE_META_QUERY_RESULT;

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/work',
    zhPath: '/zh/工作',
    title: seoMetaTitle(workPageDoc?.seo ?? undefined, typedLocale) ?? workPageTitle(typedLocale),
    description: seoDescription(workPageDoc?.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(
      workPageDoc?.seo ?? undefined,
      workPageDoc?.featuredImage ?? undefined,
    ),
    type: 'website',
    robots: workPageDoc?.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function WorkPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [
    workPageResult,
    entriesResult,
    videoFormatsResult,
    industriesResult,
    marketsResult,
    phrases,
  ] = await Promise.all([
    sanityFetch({query: WORK_PAGE_QUERY}),
    sanityFetch({query: ALL_PORTFOLIO_QUERY, stega: false}),
    sanityFetch({query: VIDEO_FORMATS_QUERY, stega: false}),
    sanityFetch({query: INDUSTRIES_QUERY, stega: false}),
    sanityFetch({query: MARKETS_QUERY, stega: false}),
    getPhraseRecord(),
  ]);
  const workPage = workPageResult.data as WORK_PAGE_QUERY_RESULT;
  const entries = entriesResult.data as PortfolioGridEntry[];
  const videoFormats = videoFormatsResult.data as TaxonomyTerm[];
  const industries = industriesResult.data as TaxonomyTerm[];
  const markets = marketsResult.data as TaxonomyTerm[];

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
