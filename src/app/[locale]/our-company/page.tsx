/**
 * Our Company page — hero, body (reused home heading + Who We Are copy),
 * Leadership/Team (founders read-only from the about doc), and Corporate Details.
 *
 * Founders are NOT stored on page-our-company. They come from a read-only
 * ABOUT_FOUNDERS_QUERY against slug=='about' — same FounderCard grid About
 * used to render before the restructure.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FounderCard } from '@/components/about/FounderCard';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { pageTitle, seoDescription, resolveMetadataImage, buildPageMetadata, seoMetaTitle } from '@/lib/metadata';
import { mergeChineseBodyWithEnglishMedia } from '@/lib/portable-text-media';
import { getPhraseRecord } from '@/lib/phrase-book';
import { buildBreadcrumbs, homeBreadcrumb, staticPageUrl } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { sanityFetch } from '@/sanity/lib/live';
import { ABOUT_FOUNDERS_QUERY, OUR_COMPANY_PAGE_QUERY } from '@/sanity/queries/pages';
import type {
  ABOUT_FOUNDERS_QUERY_RESULT,
  OUR_COMPANY_PAGE_QUERY_RESULT,
} from '@/sanity/sanity.types';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const { data } = await sanityFetch({ query: OUR_COMPANY_PAGE_QUERY, stega: false });
  const page = data as OUR_COMPANY_PAGE_QUERY_RESULT;
  if (!page) return { title: 'Not Found' };

  const title = typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;
  const metaTitle = seoMetaTitle(page.seo ?? undefined, typedLocale) ?? pageTitle(title ?? '');

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/our-company',
    // PLACEHOLDER — no real Chinese slug yet; matches the placeholder zh
    // pathname registered in src/i18n/routing.ts.
    zhPath: `/zh/${page.slugZh || 'our-company'}`,
    title: metaTitle,
    description: seoDescription(page.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(page.seo ?? undefined, page.featuredImage ?? undefined),
    type: 'website',
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function OurCompanyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [pageResult, foundersResult, phrases] = await Promise.all([
    sanityFetch({ query: OUR_COMPANY_PAGE_QUERY }),
    sanityFetch({ query: ABOUT_FOUNDERS_QUERY }),
    getPhraseRecord(),
  ]);
  const page = pageResult.data as OUR_COMPANY_PAGE_QUERY_RESULT;
  const aboutFounders = foundersResult.data as ABOUT_FOUNDERS_QUERY_RESULT;
  const founders = aboutFounders?.founders ?? [];

  if (!page) notFound();

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle || 'Our <span class="vp-outline">Company</span>';

  const bodyBlocks =
    typedLocale === 'zh' && page.bodyZh?.length
      ? mergeChineseBodyWithEnglishMedia(page.bodyZh, page.body ?? undefined)
      : page.body;

  const pageTitleLabel = pickLocaleFieldWithPhrases(typedLocale, page.title, page.titleZh, phrases);
  const pageUrl = staticPageUrl(typedLocale, '/our-company', '/zh/our-company');
  const t = await getTranslations('OurCompany');

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          { name: pageTitleLabel, url: pageUrl },
        ])}
      />
      <PageHero title={heroTitle} backgroundImage={page.featuredImage ?? undefined} />

      <SectionWrapper fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <PortableTextContent blocks={bodyBlocks} />
        </div>
      </SectionWrapper>

      {founders.length ? (
        <SectionWrapper borderTop fullBleed={true}>
          <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
            <h2 className="mb-10 text-center font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
              {t('leadershipHeading')}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {founders.map((founder, index) => (
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
          <h2 className="mb-4 font-vp-heading text-xl font-bold uppercase leading-tight tracking-vp-heading">
            {t('corporateDetailsHeading')}
          </h2>
          <p className="max-w-[700px] font-light leading-relaxed text-vp-text-muted">
            {t('corporateDetailsBody')}
          </p>
        </div>
      </SectionWrapper>
    </>
  );
}
