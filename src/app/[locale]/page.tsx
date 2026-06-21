/**
 * Home page — hero carousel, work grid, company description, brand logos, CTA.
 */

import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { BrandLogoGrid } from '@/components/home/BrandLogoGrid';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { CtaSection } from '@/components/ui/CtaSection';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { VpButton } from '@/components/ui/VpButton';
import { routing, type Locale } from '@/i18n/routing';
import { getHomeAboutParagraphs } from '@/lib/home-content';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import { SITE_SETTINGS_QUERY } from '@/sanity/queries/global';
import { HOME_PAGE_QUERY } from '@/sanity/queries/pages';
import { RECENT_PORTFOLIO_QUERY } from '@/sanity/queries/portfolio';
import type {
  HeroSlideData,
  PortfolioCard as PortfolioCardData,
  SiteSettings,
} from '@/types/sanity';

type HomePageData = {
  heroSlides?: Array<{
    buttonLabel: string;
    buttonLabelZh?: string;
    portfolioRef: Omit<HeroSlideData, 'buttonLabel' | 'buttonLabelZh'> | null;
  }>;
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

  return {
    title: `${SITE_NAME} | ${SITE_DESCRIPTION}`,
    description,
    alternates: {
      languages: { en: '/', zh: '/zh/' },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [homePage, recentWork, siteSettings] = await Promise.all([
    sanityClient.fetch<HomePageData | null>(HOME_PAGE_QUERY),
    sanityClient.fetch<PortfolioCardData[]>(RECENT_PORTFOLIO_QUERY),
    sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
  ]);

  const slides: HeroSlideData[] =
    homePage?.heroSlides
      ?.filter((slide) => slide.portfolioRef)
      .map((slide) => ({
        ...slide.portfolioRef!,
        buttonLabel: slide.buttonLabel,
        buttonLabelZh: slide.buttonLabelZh,
      })) ?? [];

  const aboutParagraphs = getHomeAboutParagraphs(typedLocale);

  return (
    <>
      <HeroCarousel slides={slides} locale={typedLocale} />

      {/* A Bit of Our Work */}
      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <h2 className="vp-section-heading mb-10 text-center text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase tracking-vp-heading">
            <span className="vp-outline">A BIT OF</span> OUR WORK
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentWork.map((entry, index) => (
              <PortfolioCard
                key={entry._id}
                entry={entry}
                locale={typedLocale}
                revealIndex={index}
              />
            ))}
          </div>
          <div className="mt-10 text-center">
            <VpButton href="/work">VIEW ALL WORK</VpButton>
          </div>
        </div>
      </SectionWrapper>

      {/* Company description */}
      <SectionWrapper borderTop>
        <div className="container-fluid mx-auto max-w-[900px] px-3 text-left md:px-4">
          <h2 className="mb-8 text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
            GLOBAL COMMERCIAL FILM PRODUCTION <span className="vp-outline">FOR</span>
            <br />
            <span className="vp-outline">AMBITIOUS BRANDS</span>
          </h2>
          <div className="space-y-4 font-light text-vp-text-muted">
            {aboutParagraphs.map((paragraph, index) => (
              <p key={index} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-8">
            <VpButton href="/about">LEARN MORE ABOUT US</VpButton>
          </div>
        </div>
      </SectionWrapper>

      {/* Brand logos */}
      <SectionWrapper borderTop>
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <h2 className="vp-section-heading mb-10 text-center text-[clamp(1.75rem,2.5vw,2.25rem)] font-bold uppercase tracking-vp-heading">
            BRANDS <span className="vp-outline">WE WORK WITH</span>
          </h2>
          <BrandLogoGrid logos={siteSettings?.brandLogos} />
        </div>
      </SectionWrapper>

      <CtaSection locale={typedLocale} />
    </>
  );
}
