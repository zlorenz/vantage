/**
 * Home page — hero carousel, work grid, company description, brand logos, CTA.
 */

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BrandLogoGrid } from '@/components/home/BrandLogoGrid';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { CtaSection } from '@/components/ui/CtaSection';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { VpButton } from '@/components/ui/VpButton';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_DESCRIPTION_FALLBACK, homePageTitle, buildPageMetadata, resolveMetadataImage, seoMetaTitle } from '@/lib/metadata';
import { getPhraseRecord } from '@/lib/phrase-book';
import {
  buildBreadcrumbs,
  buildOrganization,
  homeBreadcrumb,
  loadOrganizationSchemaInput,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { sanityFetch } from '@/sanity/lib/live';
import { HOME_PAGE_QUERY } from '@/sanity/queries/pages';
import { RECENT_PORTFOLIO_QUERY } from '@/sanity/queries/portfolio';
import type {
  HeroSlideData,
  PortfolioCard as PortfolioCardData,
  PortableTextBlock,
  SanityImage,
  SeoFields,
} from '@/types/sanity';

type HomePageData = {
  featuredImage?: SanityImage;
  body?: PortableTextBlock[];
  bodyZh?: PortableTextBlock[];
  heroSlides?: HeroSlideData[];
  featuredWork?: PortfolioCardData[];
  brandLogos?: Array<{ logoId?: string }>;
  seo?: SeoFields;
  noIndex?: boolean | null;
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
  const {data} = await sanityFetch({query: HOME_PAGE_QUERY, stega: false});
  const homePage = data as HomePageData | null;
  const description =
    typedLocale === 'zh' && homePage?.seo?.metaDescriptionZh
      ? homePage.seo.metaDescriptionZh
      : homePage?.seo?.metaDescription || SITE_DESCRIPTION_FALLBACK;

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/',
    zhPath: '/zh/',
    title: seoMetaTitle(homePage?.seo, typedLocale) ?? homePageTitle(typedLocale),
    description,
    image: resolveMetadataImage(homePage?.seo, homePage?.featuredImage),
    type: 'website',
    robots: homePage?.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [homePageResult, recentWorkResult, phrases, organization] = await Promise.all([
    sanityFetch({query: HOME_PAGE_QUERY}),
    sanityFetch({query: RECENT_PORTFOLIO_QUERY}),
    getPhraseRecord(),
    loadOrganizationSchemaInput(typedLocale),
  ]);
  const homePage = homePageResult.data as HomePageData | null;
  const recentWork = recentWorkResult.data as PortfolioCardData[];

  const slides: HeroSlideData[] = homePage?.heroSlides ?? [];

  // Curated CMS list when set; otherwise nine most recent public entries.
  const featuredWork =
    homePage?.featuredWork?.length ? homePage.featuredWork : recentWork;

  const bodyBlocks =
    typedLocale === 'zh' && homePage?.bodyZh?.length
      ? homePage.bodyZh
      : homePage?.body;

  const brandLogoIds = homePage?.brandLogos
    ?.map((item) => item.logoId)
    .filter((id): id is string => Boolean(id));

  const t = await getTranslations('Home');

  return (
    <>
      <JsonLd data={buildOrganization(organization)} />
      <JsonLd data={buildBreadcrumbs([homeBreadcrumb(typedLocale)])} />
      <HeroCarousel slides={slides} locale={typedLocale} phrases={phrases} />

      {/* A Bit of Our Work */}
      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <h2 className="vp-section-heading mb-10 text-center font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase tracking-vp-heading">
            <span className="vp-outline">{t('workSectionOutline')}</span> {t('workSection')}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredWork.map((entry, index) => (
              <PortfolioCard
                key={entry._id}
                entry={entry}
                locale={typedLocale}
                revealIndex={index}
                phrases={phrases}
              />
            ))}
          </div>
          <div className="mt-10 text-center">
            <VpButton href="/work">{t('viewAllWork')}</VpButton>
          </div>
        </div>
      </SectionWrapper>

      {/* Company description */}
      <SectionWrapper borderTop>
        <div className="container-fluid mx-auto max-w-[900px] px-3 text-left md:px-4">
          {typedLocale === 'zh' ? (
            <h2 className="mb-8 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
              {t('aboutHeadingFull')}
            </h2>
          ) : (
            <h2 className="mb-8 font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
              {t('aboutHeading')}{' '}
              <span className="vp-outline">{t('aboutHeadingOutline')}</span>
              <br />
              <span className="vp-outline">{t('aboutHeadingBrands')}</span>
            </h2>
          )}
          <PortableTextContent blocks={bodyBlocks} />
          <div className="mt-8">
            <VpButton href="/about">{t('learnMoreAboutUs')}</VpButton>
          </div>
        </div>
      </SectionWrapper>

      {/* Brand logos */}
      <SectionWrapper borderTop>
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <h2 className="vp-section-heading mb-10 text-center font-vp-heading text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase tracking-vp-heading">
            <span className="vp-outline">{t('brandsOutline')}</span> {t('brands')}
          </h2>
          <BrandLogoGrid logoIds={brandLogoIds} />
        </div>
      </SectionWrapper>

      <CtaSection locale={typedLocale} />
    </>
  );
}
