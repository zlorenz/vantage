/**
 * Industry taxonomy archive — filtered portfolio grid with pre-selected industry.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/ui/PageHero';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';
import { routing, type Locale } from '@/i18n/routing';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { taxonomyArchiveTitle, portfolioTaxonomyDescription, buildPageMetadata } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import {
  buildBreadcrumbs,
  homeBreadcrumb,
  industryPageUrl,
  workBreadcrumb,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  INDUSTRIES_QUERY,
  INDUSTRY_BY_SLUG_QUERY,
  MARKETS_QUERY,
  PORTFOLIO_BY_INDUSTRY_QUERY,
  TAXONOMY_HERO_IMAGE_QUERY,
  VIDEO_FORMATS_QUERY,
} from '@/sanity/queries/portfolio';
import type { PortfolioGridEntry, SanityImage, TaxonomyTerm } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const terms = await sanityClient.fetch<TaxonomyTerm[]>(INDUSTRIES_QUERY);

  return routing.locales.flatMap((locale) =>
    terms.map((term) => ({
      locale,
      slug: locale === 'zh' ? term.slugZh || term.slug : term.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const term = await sanityClient.fetch<TaxonomyTerm | null>(
    INDUSTRY_BY_SLUG_QUERY,
    { slug },
  );

  if (!term) return { title: 'Not Found' };

  const title = decodeHtmlEntities(
    locale === 'zh' && term.titleZh ? term.titleZh : term.title,
  );

  return buildPageMetadata({
    locale: locale as Locale,
    enPath: `/industry/${term.slug}`,
    zhPath: `/zh/产业/${term.slugZh || term.slug}`,
    title: taxonomyArchiveTitle(title),
    description: portfolioTaxonomyDescription(title),
    type: 'website',
  });
}

export default async function IndustryArchivePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const term = await sanityClient.fetch<TaxonomyTerm | null>(
    INDUSTRY_BY_SLUG_QUERY,
    { slug },
  );

  if (!term) {
    notFound();
  }

  const [entries, videoFormats, industries, markets, heroImage] = await Promise.all([
    sanityClient.fetch<PortfolioGridEntry[]>(PORTFOLIO_BY_INDUSTRY_QUERY, {
      termId: term._id,
    }),
    sanityClient.fetch<TaxonomyTerm[]>(VIDEO_FORMATS_QUERY),
    sanityClient.fetch<TaxonomyTerm[]>(INDUSTRIES_QUERY),
    sanityClient.fetch<TaxonomyTerm[]>(MARKETS_QUERY),
    sanityClient.fetch<SanityImage | null>(TAXONOMY_HERO_IMAGE_QUERY, {
      termId: term._id,
    }),
  ]);

  const heroTitle = decodeHtmlEntities(
    typedLocale === 'zh' && term.titleZh ? term.titleZh : term.title,
  );

  const activeSlug =
    typedLocale === 'zh' ? term.slugZh || term.slug : term.slug;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          workBreadcrumb(typedLocale),
          {
            name: heroTitle,
            url: industryPageUrl(typedLocale, term.slug, term.slugZh),
          },
        ])}
      />
      <PageHero title={heroTitle} backgroundImage={heroImage ?? undefined} />
      <SectionWrapper className="vp-portfolio-taxonomy">
        <div className="container-fluid px-3 md:px-4">
          <Suspense fallback={<div className="vp-load-spinner" />}>
            <PortfolioGrid
              locale={typedLocale}
              entries={entries}
              filterMode="public"
              videoFormats={videoFormats}
              industries={industries}
              markets={markets}
              presetFilters={{ industry: activeSlug }}
            />
          </Suspense>
        </div>
      </SectionWrapper>
    </>
  );
}
