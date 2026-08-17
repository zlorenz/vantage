/**
 * Vietnam Production Service page — hero, rich body, Shot in Vietnam grid, CTA.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { CtaSection } from '@/components/ui/CtaSection';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { filterVietnamProductionServiceBody } from '@/lib/portable-text-filters';
import { pageTitle, seoDescription, resolveMetadataImage, buildPageMetadata, seoMetaTitle } from '@/lib/metadata';
import { getPhraseRecord } from '@/lib/phrase-book';
import {
  buildBreadcrumbs,
  buildOrganization,
  buildProfessionalService,
  homeBreadcrumb,
  loadOrganizationSchemaInput,
  staticPageUrl,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { sanityFetch } from '@/sanity/lib/live';
import { VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY } from '@/sanity/queries/pages';
import {
  MARKET_BY_SLUG_QUERY,
  PORTFOLIO_BY_MARKET_QUERY,
} from '@/sanity/queries/portfolio';
import type { VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY_RESULT } from '@/sanity/sanity.types';
import type { PortfolioCard as PortfolioCardData } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const {data} = await sanityFetch({
    query: VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY,
    stega: false,
  });
  const page = data as VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY_RESULT;
  if (!page) return { title: 'Not Found' };

  const title = typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;
  const metaTitle =
    seoMetaTitle(page.seo ?? undefined, typedLocale) ?? pageTitle(title ?? '');

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/vietnam-production-service',
    zhPath: `/zh/${page.slugZh || '越南生产服务'}`,
    title: metaTitle,
    description: seoDescription(page.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(page.seo ?? undefined, page.featuredImage ?? undefined),
    type: 'website',
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function VietnamProductionServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [{data}, organization, phrases] = await Promise.all([
    sanityFetch({query: VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY}),
    loadOrganizationSchemaInput(typedLocale),
    getPhraseRecord(),
  ]);
  const page = data as VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY_RESULT;

  if (!page) notFound();

  // Curated CMS list when set; otherwise all public Vietnam-tagged projects.
  let vietnamPortfolio: NonNullable<typeof page.featuredWork> | PortfolioCardData[] =
    page.featuredWork ?? [];

  if (!vietnamPortfolio.length) {
    const marketResult = await sanityFetch({
      query: MARKET_BY_SLUG_QUERY,
      params: {slug: 'vietnam'},
      stega: false,
    });
    const vietnamMarket = marketResult.data as {_id: string} | null;
    if (vietnamMarket) {
      const portfolioResult = await sanityFetch({
        query: PORTFOLIO_BY_MARKET_QUERY,
        params: {termId: vietnamMarket._id},
        stega: false,
      });
      vietnamPortfolio = portfolioResult.data as PortfolioCardData[];
    } else {
      vietnamPortfolio = [];
    }
  }

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle ||
        'Vietnam <span class="vp-outline">Production Service</span>';

  const bodyBlocks = filterVietnamProductionServiceBody(
    typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body,
  );

  const pageTitleLabel =
    typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;
  const t = await getTranslations('Vietnam');

  return (
    <>
      <JsonLd data={buildOrganization(organization)} />
      <JsonLd data={buildProfessionalService(organization)} />
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          {
            name: pageTitleLabel ?? '',
            url: staticPageUrl(
              typedLocale,
              '/vietnam-production-service',
              `/zh/${page.slugZh || '越南生产服务'}`,
            ),
          },
        ])}
      />
      <PageHero title={heroTitle} backgroundImage={page.featuredImage ?? undefined} />

      <SectionWrapper fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <PortableTextContent blocks={bodyBlocks} relaxed />
        </div>
      </SectionWrapper>

      {vietnamPortfolio.length > 0 ? (
        <SectionWrapper borderTop fullBleed={true}>
          <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
            <h2 className="mb-10 text-center font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
              <span className="vp-outline">{t('shotInOutline')}</span> {t('shotIn')}
            </h2>
            <div className="vp-curated-gallery grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vietnamPortfolio.map((entry, index) => (
                <PortfolioCard
                  key={entry._id}
                  entry={entry}
                  locale={typedLocale}
                  revealIndex={index}
                  phrases={phrases}
                />
              ))}
            </div>
          </div>
        </SectionWrapper>
      ) : null}

      <CtaSection locale={typedLocale} />
    </>
  );
}
