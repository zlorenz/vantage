/**
 * About page — statement, who we are, production services, production log CTA,
 * more-about links.
 *
 * Section order: Statement -> Who We Are -> Production House ->
 * How We Move -> Production Services -> Production Log CTA ->
 * More About Vantage.
 *
 * Note: the founders/team grid no longer renders here — it lives on
 * /our-company. FounderCard and the `founders` GROQ field/query are
 * intentionally untouched; `page.founders` is still used below for
 * Organization JSON-LD.
 *
 * PageHero was removed for the redesign; featuredImage stays in
 * ABOUT_PAGE_QUERY for OG image fallback via resolveMetadataImage.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AboutStatementSection } from '@/components/about/AboutStatementSection';
import { AboutWhoWeAreSection } from '@/components/about/AboutWhoWeAreSection';
import { AboutProductionHouseSection } from '@/components/about/AboutProductionHouseSection';
import { AboutHowWeMoveSection } from '@/components/about/AboutHowWeMoveSection';
import { AboutFeatureRow } from '@/components/about/AboutFeatureRow';
import { AboutMoreSection } from '@/components/about/AboutMoreSection';
import '@/components/about/about-tokens.css';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { urlForImage } from '@/lib/sanity';
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
import { sanityFetch } from '@/sanity/lib/live';
import { ABOUT_FEATURE_POSTER_QUERY, ABOUT_PAGE_QUERY } from '@/sanity/queries/pages';
import type { ABOUT_STATEMENT_MARKERS_QUERY_RESULT } from '@/sanity/sanity.types';
import type { ABOUT_PAGE_QUERY_RESULT } from '@/sanity/sanity.types';

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

  const [pageResult, phrases, organization, featurePosterResult] = await Promise.all([
    sanityFetch({query: ABOUT_PAGE_QUERY}),
    getPhraseRecord(),
    loadOrganizationSchemaInput(typedLocale),
    sanityFetch({ query: ABOUT_FEATURE_POSTER_QUERY, stega: false }),
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
  const featurePoster = (
    (featurePosterResult.data ?? []) as ABOUT_STATEMENT_MARKERS_QUERY_RESULT
  ).find((entry) => entry.featuredImage);
  const servicesImageSrc = featurePoster?.featuredImage
    ? urlForImage(featurePoster.featuredImage).width(1280).height(1140).fit('crop').url()
    : 'https://cdn.sanity.io/images/7oesp86l/production/b2887f5288c958358c17df2f070e8ef3ece16d49-1132x756.jpg';
  const productionLogImageSrc =
    'https://cdn.sanity.io/images/7oesp86l/production/b2887f5288c958358c17df2f070e8ef3ece16d49-1132x756.jpg';

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
          imageSrc={servicesImageSrc}
          tone="yellow"
          wash
          mobile={
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-center lg:gap-x-12 lg:gap-y-0">
              <div>
                <p className="m-0 mb-4 font-vp-sans text-xs font-semibold uppercase tracking-vp-uppercase text-vp-text-soft">
                  {t('productionServicesOutline')}
                </p>
                <h2 className="m-0 font-vp-heading text-vp-page-hero font-bold uppercase leading-[1.15] tracking-vp-page-hero">
                  {t('productionServices')}
                </h2>
              </div>
              <div>
                <p className="m-0 text-[clamp(1.125rem,1.35vw,1.375rem)] font-light leading-relaxed text-vp-text-muted">
                  {t('productionServicesBody')}
                </p>
                <p className="m-0 mt-4 text-[clamp(1.125rem,1.35vw,1.375rem)] font-light leading-relaxed text-vp-text-muted">
                  {t('productionServicesBody2')}
                </p>
                <Link
                  href="/vietnam-production-service"
                  className="mt-8 inline-block font-vp-heading text-[clamp(1.125rem,1.35vw,1.375rem)] uppercase tracking-vp-heading text-vp-link no-underline transition-colors duration-vp-default hover:text-vp-link-hover"
                >
                  {t('productionServicesCta')}
                </Link>
              </div>
            </div>
          }
        />
      </SectionWrapper>

      <SectionWrapper borderTop className="vp-about-feature-section">
        <AboutFeatureRow
          title={t('productionLogCtaHeading')}
          paragraphs={[t('productionLogCtaBody')]}
          ctaLabel={t('productionLogCtaLink')}
          ctaHref="/news"
          imageSrc={productionLogImageSrc}
          mirrored
          tone="white"
          mobile={
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-center lg:gap-x-12 lg:gap-y-0">
              <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-vp-search-thumb-bg)]">
                {/* PLACEHOLDER — swap for CMS-driven BTS photo when wired */}
                <Image
                  src={productionLogImageSrc}
                  alt=""
                  fill
                  sizes="(max-width: 992px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="m-0 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
                  {t('productionLogCtaHeading')}
                </h2>
                <p className="m-0 mt-6 font-light leading-relaxed text-vp-text-muted">
                  {t('productionLogCtaBody')}
                </p>
                <Link
                  href="/news"
                  className="mt-8 inline-block font-vp-heading text-[clamp(1.125rem,1.35vw,1.375rem)] uppercase tracking-vp-heading text-vp-link no-underline transition-colors duration-vp-default hover:text-vp-link-hover"
                >
                  {t('productionLogCtaLink')}
                </Link>
              </div>
            </div>
          }
        />
      </SectionWrapper>

      <SectionWrapper borderTop className="vp-about-more-section">
        {/* Temporary — Formats, Industries, and Markets point at the first existing category page per taxonomy. Replace with taxonomy hub pages once those exist. */}
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
    </>
  );
}
