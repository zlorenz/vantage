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
import '@/components/ui/image-pair.css';
import '@/app/[locale]/contact/contact-page.css';
import './vietnam-production-service.css';

type LocationGuidePdf = {
  pdfUrl?: string | null;
  pdfLabel?: string | null;
};

type BodyImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

const BODY_IMAGE_SIZES = '(max-width: 900px) 100vw, 900px';

const GUIDE_PDF_FILENAME = 'Vietnam_Location_Guide_Vantage_Pictures.pdf';

const BRIEF_ARROW = (
  <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M4.2 12.9 11.4 5.7H6.75V4.2H14.1v7.35h-1.5V6.9L5.4 14.1z"
    />
  </svg>
);

function ServiceBodyImage({ src, alt, width, height }: BodyImage) {
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

/** Blog-style two-up row (vp-image-pair) for hardcoded CDN body images. */
function ServiceBodyImagePair({
  left,
  right,
}: {
  left: BodyImage;
  right: BodyImage;
}) {
  const slots = [
    { image: left, side: 'left' as const },
    { image: right, side: 'right' as const },
  ];

  return (
    <div className="vp-image-pair">
      {slots.map(({ image, side }) => {
        const aspect = image.width / image.height;
        return (
          <figure
            key={side}
            className={`vp-image-pair__slot vp-image-pair__slot--${side}`}
            style={{
              flexGrow: aspect,
              flexShrink: 1,
              flexBasis: 0,
            }}
          >
            <div className="vp-image-pair__brackets" aria-hidden="true">
              <span className="vp-image-pair__bracket vp-image-pair__bracket--tl" />
              <span className="vp-image-pair__bracket vp-image-pair__bracket--tr" />
              <span className="vp-image-pair__bracket vp-image-pair__bracket--br" />
              <span className="vp-image-pair__bracket vp-image-pair__bracket--bl" />
            </div>
            <div
              className="vp-image-pair__media"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                quality={90}
                className="vp-image-pair__img"
                sizes="(max-width: 767px) 100vw, 50vw"
              />
            </div>
          </figure>
        );
      })}
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

          <ServiceBodyImagePair
            left={{
              src: 'https://cdn.sanity.io/images/7oesp86l/production/868a1038b02a641388610f3a1af0672cf1328f95-734x976.jpg',
              alt: 'Mekong Delta rice fields, Kien Giang, Vietnam',
              width: 734,
              height: 976,
            }}
            right={{
              src: 'https://cdn.sanity.io/images/7oesp86l/production/12f2ba3c760ed2bddd5bcc270162f2187815d70a-734x976.jpg',
              alt: 'Bitexco Financial Tower, Ho Chi Minh City, Vietnam',
              width: 734,
              height: 976,
            }}
          />

          <h2 className={h2Class}>{copy('supportHeading')}</h2>
          <p className={pClass}>{copy('supportP1')}</p>
          <p className={pClass}>{copy('supportP2')}</p>
          <p className={pClass}>{copy('supportP3')}</p>

          <ServiceBodyImage
            src="https://cdn.sanity.io/images/7oesp86l/production/e489a50e7845555c4259fb30ba85d076fcb86767-2560x1707.jpg"
            alt="Bambu Lab X1 commercial shoot — production crew reviewing footage on set"
            width={2560}
            height={1707}
          />
        </div>
      </SectionWrapper>

      <section className="vp-contact-cta vp-contact-cta--guide">
        <div className="vp-contact-cta__frame">
          <svg className="vp-contact-cta__dash" aria-hidden="true">
            <rect />
          </svg>
          <span className="vp-contact-cta__corner vp-contact-cta__corner--tl" />
          <span className="vp-contact-cta__corner vp-contact-cta__corner--tr" />
          <span className="vp-contact-cta__corner vp-contact-cta__corner--bl" />
          <span className="vp-contact-cta__corner vp-contact-cta__corner--br" />
          <div className="vp-contact-cta__rulers">
            <CornerFrame
              variant="dark"
              showBrackets={false}
              rulers={{ top: true, bottom: true }}
            />
          </div>
          <div className="vp-contact-cta__inner">
            <div className="vp-contact-cta__copy">
              <h2 className="vp-contact-cta__heading">{copy('guideHeading')}</h2>
              <p className="vp-contact-cta__body">{copy('guideBody')}</p>
            </div>
            {guidePdfUrl ? (
              <a
                href={guidePdfUrl}
                download={guidePdf?.pdfLabel || GUIDE_PDF_FILENAME}
                target="_blank"
                rel="noopener noreferrer"
                className="vp-btn vp-btn--yellow h-auto! min-h-[var(--vp-btn-height)] whitespace-normal!"
              >
                {copy('guideCta')}
                {BRIEF_ARROW}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {vietnamPortfolio.length > 0 ? (
        <SectionWrapper borderTop fullBleed={true} variant="tight">
          <div className="vp-service-featured__header">
            <p className="vp-service-featured__eyebrow">
              <span className="vp-service-featured__eyebrow-mark" aria-hidden="true">
                ●
              </span>
              {copy('featuredWorkEyebrow')}
            </p>
            <h2 className="vp-service-featured__heading">
              {copy('featuredWorkHeading')}
            </h2>
          </div>
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
