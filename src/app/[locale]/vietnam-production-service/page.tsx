/**
 * Vietnam Production Service page — next-intl body copy + Shot in Vietnam grid.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
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

  const pageTitleLabel =
    typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;
  const t = await getTranslations('Vietnam');
  const copy = await getTranslations('VietnamProductionService');

  // Match PortableTextContent relaxed typography for long-form body.
  const h1Class =
    'mb-8 mt-10 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading first:mt-0';
  const h2Class =
    'mb-6 mt-10 font-vp-heading text-[clamp(1.5rem,2vw,1.75rem)] font-bold uppercase leading-tight tracking-vp-heading';
  const pClass = 'mb-6 font-normal leading-relaxed text-vp-text-muted last:mb-0';
  const guidePClass = 'mb-6 font-normal leading-relaxed text-black/75 last:mb-0';
  const guideCtaClassName =
    'inline-block rounded-full bg-black px-8 py-3 font-vp-heading text-sm font-semibold uppercase tracking-vp-btn text-white no-underline transition-colors duration-vp-default hover:bg-black/80';

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

      <SectionWrapper fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <h1 className={h1Class}>{copy('introHeading')}</h1>
          <p className={pClass}>{copy('introP1')}</p>
          <p className={pClass}>{copy('introP2')}</p>

          <div className="my-10 w-full">
            <Image
              src="https://cdn.sanity.io/images/7oesp86l/production/e3aea745efb8b1c63cd11b8ea0fd0378c9e64af2-635x432.jpg"
              alt="Hasfarm flower fields in Da Lat, Vietnam"
              width={635}
              height={432}
              className="h-auto w-full"
              sizes="(max-width: 900px) 100vw, 900px"
            />
          </div>

          <h2 className={h2Class}>{copy('whyHeading')}</h2>
          <p className={pClass}>{copy('whyP1')}</p>
          <p className={pClass}>{copy('whyP2')}</p>
          <p className={pClass}>{copy('whyP3')}</p>

          <div className="my-10 w-full">
            <Image
              src="https://cdn.sanity.io/images/7oesp86l/production/868a1038b02a641388610f3a1af0672cf1328f95-734x976.jpg"
              alt="Mekong Delta rice fields, Kien Giang, Vietnam"
              width={734}
              height={976}
              className="h-auto w-full"
              sizes="(max-width: 900px) 100vw, 900px"
            />
          </div>

          <h1 className={h1Class}>{copy('supportHeading')}</h1>
          <p className={pClass}>{copy('supportP1')}</p>
          <p className={pClass}>{copy('supportP2')}</p>
          <p className={pClass}>{copy('supportP3')}</p>

          <div className="my-10 w-full">
            <Image
              src="https://cdn.sanity.io/images/7oesp86l/production/12f2ba3c760ed2bddd5bcc270162f2187815d70a-734x976.jpg"
              alt="Bitexco Financial Tower, Ho Chi Minh City, Vietnam"
              width={734}
              height={976}
              className="h-auto w-full"
              sizes="(max-width: 900px) 100vw, 900px"
            />
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper fullBleed={true} className="bg-white text-black">
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <h2 className={`${h2Class} first:mt-0`}>{copy('guideHeading')}</h2>
          <p className={guidePClass}>{copy('guideP1')}</p>
          <p className={guidePClass}>{copy('guideP2')}</p>
          <p className="vp-pt-cta-button">
            <Link href="/vietnam-location-guide" className={guideCtaClassName}>
              {copy('guideCta')}
            </Link>
          </p>
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
    </>
  );
}
