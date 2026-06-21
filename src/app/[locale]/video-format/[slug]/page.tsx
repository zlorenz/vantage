/**
 * Video format taxonomy archive — filtered portfolio grid with pre-selected format.
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
import { taxonomyArchiveTitle } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import {
  INDUSTRIES_QUERY,
  MARKETS_QUERY,
  PORTFOLIO_BY_VIDEO_FORMAT_QUERY,
  TAXONOMY_HERO_IMAGE_QUERY,
  VIDEO_FORMAT_BY_SLUG_QUERY,
  VIDEO_FORMATS_QUERY,
} from '@/sanity/queries/portfolio';
import type { PortfolioGridEntry, SanityImage, TaxonomyTerm } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const terms = await sanityClient.fetch<TaxonomyTerm[]>(VIDEO_FORMATS_QUERY);

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
    VIDEO_FORMAT_BY_SLUG_QUERY,
    { slug },
  );

  if (!term) return { title: 'Not Found' };

  const title = decodeHtmlEntities(
    locale === 'zh' && term.titleZh ? term.titleZh : term.title,
  );

  return {
    title: taxonomyArchiveTitle(title),
    alternates: {
      languages: {
        en: `/video-format/${term.slug}`,
        zh: `/zh/视频格式/${term.slugZh || term.slug}`,
      },
    },
  };
}

export default async function VideoFormatArchivePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const term = await sanityClient.fetch<TaxonomyTerm | null>(
    VIDEO_FORMAT_BY_SLUG_QUERY,
    { slug },
  );

  if (!term) {
    notFound();
  }

  const [entries, videoFormats, industries, markets, heroImage] = await Promise.all([
    sanityClient.fetch<PortfolioGridEntry[]>(PORTFOLIO_BY_VIDEO_FORMAT_QUERY, {
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
      <PageHero title={heroTitle} backgroundImage={heroImage ?? undefined} />
      <SectionWrapper className="vp-portfolio-taxonomy">
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <Suspense fallback={<div className="vp-load-spinner" />}>
            <PortfolioGrid
              locale={typedLocale}
              entries={entries}
              filterMode="public"
              videoFormats={videoFormats}
              industries={industries}
              markets={markets}
              presetFilters={{ format: activeSlug }}
            />
          </Suspense>
        </div>
      </SectionWrapper>
    </>
  );
}
