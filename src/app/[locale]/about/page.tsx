/**
 * About page — statement, who we are, production services, production log CTA,
 * more-about links, campaign CTA.
 *
 * Section order: Statement -> Who We Are -> Production House ->
 * How We Move -> Production Services -> Production Log CTA ->
 * More About Vantage -> CtaSection.
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
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AboutStatementSection } from '@/components/about/AboutStatementSection';
import { AboutWhoWeAreSection } from '@/components/about/AboutWhoWeAreSection';
import { AboutProductionHouseSection } from '@/components/about/AboutProductionHouseSection';
import { AboutHowWeMoveSection } from '@/components/about/AboutHowWeMoveSection';
import { CtaSection } from '@/components/ui/CtaSection';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { VpButton } from '@/components/ui/VpButton';
import { Link } from '@/i18n/navigation';
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
import { sanityFetch } from '@/sanity/lib/live';
import { ABOUT_PAGE_QUERY } from '@/sanity/queries/pages';
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

  const [pageResult, phrases, organization] = await Promise.all([
    sanityFetch({query: ABOUT_PAGE_QUERY}),
    getPhraseRecord(),
    loadOrganizationSchemaInput(typedLocale),
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

      <SectionWrapper borderTop>
        <p className="m-0 mb-4 font-vp-sans text-xs font-semibold uppercase tracking-vp-uppercase text-vp-text-soft">
          {t('productionServicesOutline')}
        </p>
        <h2 className="m-0 mb-6 font-vp-heading text-[clamp(2.5rem,4.375vw,3.75rem)] font-bold uppercase leading-tight tracking-vp-heading">
          {t('productionServices')}
        </h2>
        <p className="m-0 max-w-[42rem] text-[clamp(1.125rem,1.35vw,1.375rem)] font-light leading-relaxed text-vp-text-muted">
          {t('productionServicesBody')}
        </p>
        <Link
          href="/vietnam-production-service"
          className="mt-8 inline-block text-[clamp(1.125rem,1.35vw,1.375rem)] text-vp-link no-underline transition-colors duration-vp-default hover:text-vp-link-hover hover:underline"
        >
          {t('productionServicesCta')} →
        </Link>
      </SectionWrapper>

      <SectionWrapper borderTop fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <h2 className="mb-4 font-vp-heading text-xl font-bold uppercase leading-tight tracking-vp-heading">
            {t('productionLogCtaHeading')}
          </h2>
          <p className="mb-6 max-w-[700px] font-light leading-relaxed text-vp-text-muted">
            {t('productionLogCtaBody')}
          </p>
          <VpButton href="/news">{t('productionLogCtaLink')}</VpButton>
        </div>
      </SectionWrapper>

      <SectionWrapper variant="tight" borderTop fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <h2 className="mb-3 font-vp-heading text-xs font-normal uppercase tracking-vp-heading text-vp-text-soft">
            {t('moreAboutVantage')}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            <li>
              <Link
                href="/vietnam-production-service"
                className="text-sm text-vp-link no-underline hover:text-vp-link-hover hover:underline"
              >
                {t('moreAboutVietnamProductionService')}
              </Link>
            </li>
            <li>
              <Link
                href="/our-industry"
                className="text-sm text-vp-link no-underline hover:text-vp-link-hover hover:underline"
              >
                {t('moreAboutOurIndustry')}
              </Link>
            </li>
            <li>
              <Link
                href="/our-company"
                className="text-sm text-vp-link no-underline hover:text-vp-link-hover hover:underline"
              >
                {t('moreAboutOurCompany')}
              </Link>
            </li>
            <li>
              <Link
                href="/awards"
                className="text-sm text-vp-link no-underline hover:text-vp-link-hover hover:underline"
              >
                {t('moreAboutAwards')}
              </Link>
            </li>
          </ul>
        </div>
      </SectionWrapper>

      <CtaSection locale={typedLocale} />
    </>
  );
}
