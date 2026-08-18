/**
 * Home page — featured-work carousel hero.
 *
 * generateMetadata still reads the CMS home document for title, description,
 * OG image, and noIndex. METADATA_BASE remains https://vantage.pictures
 * (existing sitewide behaviour, unchanged here).
 */

import type {Metadata} from 'next';
import {setRequestLocale} from 'next-intl/server';
import {HomeContactSection} from '@/components/home/HomeContactSection';
import {ChromeBleedStrip} from '@/components/prototype/carousel/ChromeBleedStrip';
import {FeaturedWorkCarousel} from '@/components/prototype/carousel/FeaturedWorkCarousel';
import {loadFeaturedWorkSlides} from '@/components/prototype/carousel/load-slides';
import {JsonLd} from '@/components/seo/JsonLd';
import {routing, type Locale} from '@/i18n/routing';
import {
  SITE_DESCRIPTION_FALLBACK,
  homePageTitle,
  buildPageMetadata,
  resolveMetadataImage,
  seoMetaTitle,
} from '@/lib/metadata';
import {
  buildBreadcrumbs,
  buildOrganization,
  homeBreadcrumb,
  loadOrganizationSchemaInput,
} from '@/lib/structured-data';
import {sanityFetch} from '@/sanity/lib/live';
import {HOME_PAGE_QUERY} from '@/sanity/queries/pages';
import type {SanityImage, SeoFields} from '@/types/sanity';

type HomePageData = {
  featuredImage?: SanityImage;
  seo?: SeoFields;
  noIndex?: boolean | null;
};

type Props = {
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
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
    robots: homePage?.noIndex ? {index: false, follow: false} : undefined,
  });
}

export default async function HomePage({params}: Props) {
  const {locale} = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [slides, organization] = await Promise.all([
    loadFeaturedWorkSlides(typedLocale),
    loadOrganizationSchemaInput(typedLocale),
  ]);

  return (
    <>
      <JsonLd data={buildOrganization(organization)} />
      <JsonLd data={buildBreadcrumbs([homeBreadcrumb(typedLocale)])} />
      <FeaturedWorkCarousel slides={slides} />
      <ChromeBleedStrip />
      <HomeContactSection />
    </>
  );
}
