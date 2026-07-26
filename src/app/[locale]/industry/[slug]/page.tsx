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
import { permanentRedirect } from '@/i18n/navigation';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { taxonomyArchiveTitle, portfolioTaxonomyDescription, buildPageMetadata } from '@/lib/metadata';
import { decodePathSlug, expandSlugParam, canonicalSlugForLocale } from '@/lib/path-slug';
import { sanityClient } from '@/lib/sanity';
import { getPhraseRecord } from '@/lib/phrase-book';
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
    terms.flatMap((term) => {
      const base = locale === 'zh' ? term.slugZh || term.slug : term.slug;
      return expandSlugParam(base).map((slug) => ({ locale, slug }));
    }),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decodePathSlug(rawSlug);
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
    description: portfolioTaxonomyDescription(title, locale as Locale),
    type: 'website',
  });
}

export default async function IndustryArchivePage({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  const slug = decodePathSlug(rawSlug);

  const typedLocale = locale as Locale;

  const term = await sanityClient.fetch<TaxonomyTerm | null>(
    INDUSTRY_BY_SLUG_QUERY,
    { slug },
  );

  if (!term) {
    notFound();
  }

  const canonicalSlug = canonicalSlugForLocale(
    typedLocale,
    slug,
    term.slug,
    term.slugZh,
  );
  if (canonicalSlug) {
    permanentRedirect({
      href: {
        pathname: '/industry/[slug]',
        params: { slug: canonicalSlug },
      },
      locale: typedLocale,
    });
  }

  const [entries, videoFormats, industries, markets, heroImage, phrases] = await Promise.all([
    sanityClient.fetch<PortfolioGridEntry[]>(PORTFOLIO_BY_INDUSTRY_QUERY, {
      termId: term._id,
    }),
    sanityClient.fetch<TaxonomyTerm[]>(VIDEO_FORMATS_QUERY),
    sanityClient.fetch<TaxonomyTerm[]>(INDUSTRIES_QUERY),
    sanityClient.fetch<TaxonomyTerm[]>(MARKETS_QUERY),
    sanityClient.fetch<SanityImage | null>(TAXONOMY_HERO_IMAGE_QUERY, {
      termId: term._id,
    }),
    getPhraseRecord(),
  ]);

  const heroTitle = decodeHtmlEntities(
    pickLocaleFieldWithPhrases(typedLocale, term.title, term.titleZh, phrases),
  );

  const intro = pickLocaleFieldWithPhrases(
    typedLocale,
    term.description,
    term.descriptionZh,
    phrases,
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
          {intro ? (
            <div className="vp-work-intro container mx-auto mb-8 text-center font-light text-vp-text-muted min-[1400px]:max-w-[1320px]">
              <p>{intro}</p>
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
              presetFilters={{ industry: activeSlug }}
            />
          </Suspense>
        </div>
      </SectionWrapper>
    </>
  );
}
