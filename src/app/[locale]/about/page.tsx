/**
 * About page — hero, who we are, team grid, production services, CTA.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FounderCard } from '@/components/about/FounderCard';
import { CtaSection } from '@/components/ui/CtaSection';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
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
import { filterAboutBodyBlocks } from '@/lib/about-content';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { mergeChineseBodyWithEnglishMedia } from '@/lib/portable-text-media';
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

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle || 'About <span class="vp-outline">Us</span>';

  const bodyBlocks = filterAboutBodyBlocks(
    typedLocale === 'zh' && page.bodyZh?.length
      ? mergeChineseBodyWithEnglishMedia(page.bodyZh, page.body ?? undefined)
      : page.body ?? undefined,
    page.founders?.map((founder) => founder.name).filter((name): name is string => Boolean(name)) ??
      [],
  );

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
      <PageHero title={heroTitle} backgroundImage={page.featuredImage ?? undefined} />

      <SectionWrapper fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <PortableTextContent blocks={bodyBlocks} />
        </div>
      </SectionWrapper>

      {page.founders?.length ? (
        <SectionWrapper borderTop fullBleed={true}>
          <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
            <h2 className="mb-10 text-center font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
              <span className="vp-outline">{t('teamOutline')}</span> {t('team')}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {page.founders.map((founder, index) => (
                <FounderCard
                  key={`founder-${index}`}
                  founder={founder}
                  locale={typedLocale}
                  phrases={phrases}
                />
              ))}
            </div>
          </div>
        </SectionWrapper>
      ) : null}

      <SectionWrapper borderTop fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <h2 className="mb-6 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
            <span className="vp-outline">{t('productionServicesOutline')}</span>{' '}
            {t('productionServices')}
          </h2>
          <div className="font-light text-vp-text-muted">
            <p className="mb-4 leading-relaxed">{t('productionServicesBody')}</p>
            <p className="mb-4 leading-relaxed last:mb-0">
              {t('productionServicesBody2')}
            </p>
          </div>
          <div className="mt-8">
            <VpButton href="/vietnam-production-service">
              {t('productionServicesCta')}
            </VpButton>
          </div>
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
          </ul>
        </div>
      </SectionWrapper>

      <CtaSection locale={typedLocale} />
    </>
  );
}
