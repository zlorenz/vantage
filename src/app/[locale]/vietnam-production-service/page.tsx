/**
 * Vietnam Production Service page — news-style header + body + Shot in Vietnam grid.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PortfolioIndexGridCard } from '@/components/portfolio/PortfolioIndexGridCard';
import { CornerFrame } from '@/components/ui/CornerFrame';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
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
import {
  VIETNAM_LOCATION_GUIDE_PDF_QUERY,
  VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY,
} from '@/sanity/queries/pages';
import {
  MARKET_BY_SLUG_QUERY,
  PORTFOLIO_BY_MARKET_QUERY,
} from '@/sanity/queries/portfolio';
import type { VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY_RESULT } from '@/sanity/sanity.types';
import type { PortfolioCard as PortfolioCardData } from '@/types/sanity';
import '@/components/about/about-tokens.css';
import './vietnam-production-service.css';

type LocationGuidePdf = {
  pdfUrl?: string | null;
  pdfLabel?: string | null;
};

const GUIDE_CTA_CLASS =
  'vp-btn vp-btn--yellow h-auto! min-h-[var(--vp-btn-height)] whitespace-normal!';

const BODY_IMAGE_SIZES = '(max-width: 900px) 100vw, 900px';

function ServiceBodyImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <div className="vp-service-body-image">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full"
        sizes={BODY_IMAGE_SIZES}
      />
      <CornerFrame
        variant="dark"
        crosshair={{ size: 40, color: 'var(--vp-text)' }}
      />
    </div>
  );
}

/** Query includes excerpt; regenerate Sanity types when convenient. */
type VpsPage = VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY_RESULT & {
  excerpt?: string | null;
  excerptZh?: string | null;
};

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
  const page = data as VpsPage;
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

  const [{data}, guidePdfResult, organization, phrases] = await Promise.all([
    sanityFetch({query: VIETNAM_PRODUCTION_SERVICE_PAGE_QUERY}),
    sanityFetch({query: VIETNAM_LOCATION_GUIDE_PDF_QUERY, stega: false}),
    loadOrganizationSchemaInput(typedLocale),
    getPhraseRecord(),
  ]);
  const page = data as VpsPage;
  const guidePdf = guidePdfResult.data as LocationGuidePdf | null;
  const guidePdfUrl = guidePdf?.pdfUrl ?? null;

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
  const headerIntro =
    pickLocaleFieldWithPhrases(
      typedLocale,
      page.excerpt,
      page.excerptZh,
      phrases,
    ) || copy('headerIntro');

  // Match PortableTextContent relaxed typography for long-form body.
  const h2Class =
    'mb-6 mt-10 font-vp-heading text-[clamp(1.5rem,2vw,1.75rem)] font-bold uppercase leading-tight tracking-vp-heading';
  const pClass = 'mb-6 font-normal leading-relaxed text-vp-text-muted last:mb-0';

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

      <SectionWrapper
        className="vp-news-page !pt-[var(--vp-section-y-header-condensed)]"
        fullBleed={true}
      >
        <div className="vp-news-page__chrome">
          <header className="vp-news-page__header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="vp-news-page__motif"
              src="/brand/vap-pattern.svg"
              alt=""
              aria-hidden="true"
            />
            <div className="vp-news-page__heading">
              <p className="vp-news-page__eyebrow">{`●  ${copy('eyebrow')}`}</p>
              <div className="vp-news-page__title-block">
                <h1 className="vp-news-page__title">{copy('introHeading')}</h1>
                {headerIntro ? (
                  <div className="vp-news-page__intro">
                    <p>{headerIntro}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <div className="vp-news-page__rule" aria-hidden="true" />
        </div>

        <div className="container-fluid mx-auto max-w-[900px] px-3 pt-10 md:px-4">
          <p className={`${pClass} first:mt-0`}>{copy('introP1')}</p>
          <p className={pClass}>{copy('introP2')}</p>

          <ServiceBodyImage
            src="https://cdn.sanity.io/images/7oesp86l/production/e3aea745efb8b1c63cd11b8ea0fd0378c9e64af2-635x432.jpg"
            alt="Hasfarm flower fields in Da Lat, Vietnam"
            width={635}
            height={432}
          />

          <h2 className={h2Class}>{copy('whyHeading')}</h2>
          <p className={pClass}>{copy('whyP1')}</p>
          <p className={pClass}>{copy('whyP2')}</p>
          <p className={pClass}>{copy('whyP3')}</p>

          <ServiceBodyImage
            src="https://cdn.sanity.io/images/7oesp86l/production/868a1038b02a641388610f3a1af0672cf1328f95-734x976.jpg"
            alt="Mekong Delta rice fields, Kien Giang, Vietnam"
            width={734}
            height={976}
          />

          <h2 className={h2Class}>{copy('supportHeading')}</h2>
          <p className={pClass}>{copy('supportP1')}</p>
          <p className={pClass}>{copy('supportP2')}</p>
          <p className={pClass}>{copy('supportP3')}</p>

          <ServiceBodyImage
            src="https://cdn.sanity.io/images/7oesp86l/production/12f2ba3c760ed2bddd5bcc270162f2187815d70a-734x976.jpg"
            alt="Bitexco Financial Tower, Ho Chi Minh City, Vietnam"
            width={734}
            height={976}
          />
        </div>
      </SectionWrapper>

      <SectionWrapper fullBleed={true} borderTop>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <h2 className={`${h2Class} first:mt-0`}>{copy('guideHeading')}</h2>
          <p className={pClass}>{copy('guideP1')}</p>
          <p className={pClass}>{copy('guideP2')}</p>
          {guidePdfUrl ? (
            <div className="vp-pt-cta-button">
              <a
                href={guidePdfUrl}
                download={
                  guidePdf?.pdfLabel ||
                  'Vietnam_Location_Guide_Vantage_Pictures.pdf'
                }
                target="_blank"
                rel="noopener noreferrer"
                className={GUIDE_CTA_CLASS}
              >
                {copy('guideCta')}
              </a>
            </div>
          ) : null}
        </div>
      </SectionWrapper>

      {vietnamPortfolio.length > 0 ? (
        <SectionWrapper borderTop fullBleed={true} variant="tight">
          <h2 className="mb-8 px-[var(--vp-overlay-mobile-pad-inline,16px)] font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading md:mb-10 md:px-[var(--spacing-vp-gutter,1.875rem)]">
            {t('shotInOutline')} {t('shotIn')}
          </h2>
          <ul className="vp-portfolio-index__grid">
            {vietnamPortfolio.map((entry) => (
              <PortfolioIndexGridCard
                key={entry._id}
                entry={entry}
                locale={typedLocale}
                phrases={phrases}
              />
            ))}
          </ul>
        </SectionWrapper>
      ) : null}
    </>
  );
}
