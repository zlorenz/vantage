/**
 * Vietnam Production Service page — hero, rich body, Shot in Vietnam grid, CTA.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { CtaSection } from '@/components/ui/CtaSection';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { getVietnamCtaContent } from '@/lib/cta-content';
import { filterVietnamProductionServiceBody } from '@/lib/portable-text-filters';
import { pageTitle, seoDescription, buildOgImage } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import { PAGE_BY_SLUG_QUERY } from '@/sanity/queries/pages';
import {
  MARKET_BY_SLUG_QUERY,
  PORTFOLIO_BY_MARKET_QUERY,
} from '@/sanity/queries/portfolio';
import type { PageDocument, PortfolioCard as PortfolioCardData } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = await sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, {
    slug: 'vietnam-production-service',
  });
  if (!page) return { title: 'Not Found' };

  const title = locale === 'zh' && page.titleZh ? page.titleZh : page.title;

  return {
    title: pageTitle(title),
    description: seoDescription(page.seo, locale as Locale),
    openGraph: { images: buildOgImage(page.featuredImage) },
    alternates: {
      languages: {
        en: '/vietnam-production-service',
        zh: `/zh/${page.slugZh || '越南生产服务'}`,
      },
    },
  };
}

export default async function VietnamProductionServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const page = await sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, {
    slug: 'vietnam-production-service',
  });

  if (!page) notFound();

  const vietnamMarket = await sanityClient.fetch<{ _id: string } | null>(
    MARKET_BY_SLUG_QUERY,
    { slug: 'vietnam' },
  );

  const vietnamPortfolio = vietnamMarket
    ? await sanityClient.fetch<PortfolioCardData[]>(PORTFOLIO_BY_MARKET_QUERY, {
        termId: vietnamMarket._id,
      })
    : [];

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle ||
        'Vietnam <span class="vp-outline">Production Service</span>';

  const bodyBlocks = filterVietnamProductionServiceBody(
    typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body,
  );

  return (
    <>
      <PageHero title={heroTitle} backgroundImage={page.featuredImage} />

      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <PortableTextContent blocks={bodyBlocks} relaxed />
        </div>
      </SectionWrapper>

      {vietnamPortfolio.length > 0 ? (
        <SectionWrapper borderTop>
          <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
            <h2 className="mb-10 text-center text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase tracking-vp-heading">
              SHOT IN <span className="vp-outline">VIETNAM</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vietnamPortfolio.map((entry, index) => (
                <PortfolioCard
                  key={entry._id}
                  entry={entry}
                  locale={typedLocale}
                  revealIndex={index}
                />
              ))}
            </div>
          </div>
        </SectionWrapper>
      ) : null}

      <CtaSection locale={typedLocale} content={getVietnamCtaContent(typedLocale)} />
    </>
  );
}
