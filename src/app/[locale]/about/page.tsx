/**
 * About page — statement, who we are, production services, production log CTA,
 * more-about links.
 *
 * Section order: Statement -> Who We Are -> Production House ->
 * How We Move -> Production Services -> Production Log CTA.
 * More About Vantage is temporarily hidden until the SEO hub pages
 * it links to are ready (component + copy kept).
 *
 * Note: the founders/team grid no longer renders here — it lives on
 * /our-company. FounderCard and the `founders` GROQ field/query are
 * intentionally untouched; `page.founders` is still used below for
 * Organization JSON-LD.
 *
 * PageHero is not used; featuredImage stays in ABOUT_PAGE_QUERY for OG
 * image fallback via resolveMetadataImage.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AboutStatementSection } from '@/components/about/AboutStatementSection';
import { AboutWhoWeAreSection } from '@/components/about/AboutWhoWeAreSection';
import { AboutProductionHouseSection } from '@/components/about/AboutProductionHouseSection';
import { AboutHowWeMoveSection } from '@/components/about/AboutHowWeMoveSection';
import { AboutFeatureRow } from '@/components/about/AboutFeatureRow';
// import { AboutMoreSection } from '@/components/about/AboutMoreSection';
import '@/components/about/about-tokens.css';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import {
  aboutContactPageTitle,
  seoDescription,
  resolveMetadataImage,
  buildPageMetadata,
  seoMetaTitle,
} from '@/lib/metadata';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { getPhraseRecord } from '@/lib/phrase-book';
import {
  aboutBreadcrumb,
  buildBreadcrumbs,
  buildOrganization,
  buildProfessionalService,
  homeBreadcrumb,
  loadOrganizationSchemaInput,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  aboutPreviewPosterUrl,
  loadAboutMedia,
  resolveAboutPreviewSlot,
  type AboutPreviewMedia,
} from '@/lib/about-media';
import { sanityFetch } from '@/sanity/lib/live';
import { ABOUT_FEATURE_POSTER_QUERY, ABOUT_PAGE_QUERY } from '@/sanity/queries/pages';
import type { ABOUT_STATEMENT_MARKERS_QUERY_RESULT } from '@/sanity/sanity.types';
import type { ABOUT_PAGE_QUERY_RESULT } from '@/sanity/sanity.types';

const CTA_FALLBACK_IMAGE =
  'https://cdn.sanity.io/images/7oesp86l/production/b2887f5288c958358c17df2f070e8ef3ece16d49-1132x756.jpg';

function ctaFallback(src: string): AboutPreviewMedia {
  return {
    src,
    alt: '',
    previewVimeoUrl: null,
    previewStartSeconds: null,
    previewEndSeconds: null,
  };
}

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const {data} = await sanityFetch({query: ABOUT_PAGE_QUERY, stega: false});
  const page = data as ABOUT_PAGE_QUERY_RESULT;
  if (!page) return { title: 'Not Found' };

  const title = typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;
  const metaTitle =
    seoMetaTitle(page.seo ?? undefined, typedLocale) ??
    aboutContactPageTitle(title ?? '', typedLocale);

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/about',
    zhPath: `/zh/${page.slugZh || '关于'}`,
    title: metaTitle,
    description: seoDescription(page.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(page.seo ?? undefined, page.featuredImage ?? undefined),
    type: 'website',
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [pageResult, phrases, organization, aboutMedia, featurePosterResult] =
    await Promise.all([
      sanityFetch({query: ABOUT_PAGE_QUERY}),
      getPhraseRecord(),
      loadOrganizationSchemaInput(typedLocale),
      loadAboutMedia(),
      sanityFetch({query: ABOUT_FEATURE_POSTER_QUERY, stega: false}),
    ]);
  const page = pageResult.data as ABOUT_PAGE_QUERY_RESULT;

  if (!page) notFound();

  const pageTitleLabel = pickLocaleFieldWithPhrases(
    typedLocale,
    page.title,
    page.titleZh,
    phrases,
  );
  const t = await getTranslations('About');

  const servicesMedia =
    resolveAboutPreviewSlot(
      aboutMedia?.productionServicesCta,
      typedLocale,
    ) ??
    (() => {
      const featurePoster = (
        (featurePosterResult.data ?? []) as ABOUT_STATEMENT_MARKERS_QUERY_RESULT
      ).find((entry) => entry.featuredImage);
      return featurePoster?.featuredImage
        ? ctaFallback(aboutPreviewPosterUrl(featurePoster.featuredImage))
        : ctaFallback(CTA_FALLBACK_IMAGE);
    })();

  const productionLogMedia =
    resolveAboutPreviewSlot(
      aboutMedia?.productionLogCta,
      typedLocale,
    ) ?? ctaFallback(CTA_FALLBACK_IMAGE);

  return (
    <>
      <JsonLd
        data={buildOrganization({
          ...organization,
          founders: page.founders,
        })}
      />
      <JsonLd data={buildProfessionalService(organization)} />
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          { name: pageTitleLabel, url: aboutBreadcrumb(typedLocale).url },
        ])}
      />

      <AboutStatementSection />

      <AboutWhoWeAreSection />

      <AboutProductionHouseSection />

      <AboutHowWeMoveSection />

      {/* Founders/team grid renders on /our-company — intentionally not rendered here. */}

      <SectionWrapper borderTop className="vp-about-feature-section">
        <AboutFeatureRow
          title={t('productionServices')}
          paragraphs={[t('productionServicesBody'), t('productionServicesBody2')]}
          ctaLabel={t('productionServicesCta')}
          ctaHref="/vietnam-production-service"
          imageSrc={servicesMedia.src}
          imageAlt={servicesMedia.alt}
          previewVimeoUrl={servicesMedia.previewVimeoUrl}
          previewStartSeconds={servicesMedia.previewStartSeconds}
          previewEndSeconds={servicesMedia.previewEndSeconds}
          tone="yellow"
          wash
        />
      </SectionWrapper>

      <SectionWrapper borderTop className="vp-about-feature-section">
        <AboutFeatureRow
          title={t('productionLogCtaHeading')}
          paragraphs={[t('productionLogCtaBody')]}
          ctaLabel={t('productionLogCtaLink')}
          ctaHref="/news"
          imageSrc={productionLogMedia.src}
          imageAlt={productionLogMedia.alt}
          previewVimeoUrl={productionLogMedia.previewVimeoUrl}
          previewStartSeconds={productionLogMedia.previewStartSeconds}
          previewEndSeconds={productionLogMedia.previewEndSeconds}
          mirrored
          tone="white"
        />
      </SectionWrapper>

      {/* Temporary hide — restore once Formats / Industries / Markets hubs ship.
      <SectionWrapper borderTop className="vp-about-more-section">
        <AboutMoreSection
          title={t('moreAboutVantage')}
          body={t('moreAboutVantageBody')}
          links={[
            { label: t('moreAboutOurCompany'), href: '/our-company' },
            {
              label: t('moreAboutFormats'),
              href: { pathname: '/video-format/[slug]', params: { slug: 'brand-film' } },
            },
            {
              label: t('moreAboutIndustries'),
              href: { pathname: '/industry/[slug]', params: { slug: 'ai-robotics' } },
            },
            {
              label: t('moreAboutMarkets'),
              href: { pathname: '/market/[slug]', params: { slug: 'china' } },
            },
            { label: t('moreAboutAwards'), href: '/awards' },
          ]}
        />
      </SectionWrapper>
      */}
    </>
  );
}
