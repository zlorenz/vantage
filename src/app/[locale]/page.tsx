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
import { SITE_DESCRIPTION, buildOgImage, buildPageMetadata, homePageTitle } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import { getPhraseRecord } from '@/lib/phrase-book';
import { buildBreadcrumbs, buildOrganization, homeBreadcrumb } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { HOME_PAGE_QUERY } from '@/sanity/queries/pages';
import { RECENT_PORTFOLIO_QUERY } from '@/sanity/queries/portfolio';
import type {
  HeroSlideData,
  PortfolioCard as PortfolioCardData,
  PortableTextBlock,
  SanityImage,
} from '@/types/sanity';

type HomePageData = {
  featuredImage?: SanityImage;
  body?: PortableTextBlock[];
  bodyZh?: PortableTextBlock[];
  heroSlides?: HeroSlideData[];
  featuredWork?: PortfolioCardData[];
  brandLogos?: Array<{ logoId?: string }>;
  seo?: { metaDescription?: string; metaDescriptionZh?: string };
};

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const homePage = await sanityClient.fetch<HomePageData | null>(HOME_PAGE_QUERY);
  const description =
    locale === 'zh' && homePage?.seo?.metaDescriptionZh
      ? homePage.seo.metaDescriptionZh
      : homePage?.seo?.metaDescription || SITE_DESCRIPTION;

  return buildPageMetadata({
    locale: locale as Locale,
    enPath: '/',
    zhPath: '/zh/',
    title: homePageTitle(locale as Locale),
    description,
    image: buildOgImage(homePage?.featuredImage),
    type: 'website',
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [homePage, recentWork, phrases] = await Promise.all([
    sanityClient.fetch<HomePageData | null>(HOME_PAGE_QUERY),
    sanityClient.fetch<PortfolioCardData[]>(RECENT_PORTFOLIO_QUERY),
    getPhraseRecord(),
  ]);

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
      <JsonLd data={buildOrganization()} />
      <JsonLd data={buildBreadcrumbs([homeBreadcrumb(typedLocale)])} />
      <HeroCarousel slides={slides} locale={typedLocale} phrases={phrases} />

      {/* A Bit of Our Work */}
      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <h2 className="vp-section-heading mb-10 text-center text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase tracking-vp-heading">
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
            <h2 className="mb-8 text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
              {t('aboutHeadingFull')}
            </h2>
          ) : (
            <h2 className="mb-8 text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
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
          <h2 className="vp-section-heading mb-10 text-center text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase tracking-vp-heading">
            <span className="vp-outline">{t('brandsOutline')}</span> {t('brands')}
          </h2>
          <BrandLogoGrid logoIds={brandLogoIds} />
        </div>
      </SectionWrapper>

      <CtaSection locale={typedLocale} />
    </>
  );
}
