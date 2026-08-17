/**
 * Vietnam Location Guide page — hero, body, PDF download.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FileDownloadBlock } from '@/components/ui/FileDownloadBlock';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { filterPdfDownloadArtifactBlocks } from '@/lib/portable-text-filters';
import {
  vietnamLocationGuideTitle,
  seoDescription,
  resolveMetadataImage,
  buildPageMetadata,
  seoMetaTitle,
} from '@/lib/metadata';
import {
  buildBreadcrumbs,
  homeBreadcrumb,
  staticPageUrl,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { sanityFetch } from '@/sanity/lib/live';
import { VIETNAM_LOCATION_GUIDE_PAGE_QUERY } from '@/sanity/queries/pages';
import type { VIETNAM_LOCATION_GUIDE_PAGE_QUERY_RESULT } from '@/sanity/sanity.types';

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
    query: VIETNAM_LOCATION_GUIDE_PAGE_QUERY,
    stega: false,
  });
  const page = data as VIETNAM_LOCATION_GUIDE_PAGE_QUERY_RESULT;
  if (!page) return { title: 'Not Found' };

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/vietnam-location-guide',
    zhPath: `/zh/${page.slugZh || '越南旅游指南'}`,
    title:
      seoMetaTitle(page.seo ?? undefined, typedLocale) ??
      vietnamLocationGuideTitle(typedLocale),
    description: seoDescription(page.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(page.seo ?? undefined, page.featuredImage ?? undefined),
    type: 'website',
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function VietnamLocationGuidePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const {data} = await sanityFetch({query: VIETNAM_LOCATION_GUIDE_PAGE_QUERY});
  const page = data as VIETNAM_LOCATION_GUIDE_PAGE_QUERY_RESULT;

  if (!page) notFound();

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle ||
        '<span class="vp-outline">Vietnam</span> Location Guidebook';

  const bodyBlocks = filterPdfDownloadArtifactBlocks(
    typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body,
  );

  const pdfUrl = page.pdfDownload?.file?.asset?.url;
  const pdfLabel =
    page.pdfDownload?.label || 'Vietnam_Location_Guide_Vantage_Pictures.pdf';
  const t = await getTranslations('Vietnam');

  const pageTitleLabel =
    typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          {
            name: pageTitleLabel ?? '',
            url: staticPageUrl(
              typedLocale,
              '/vietnam-location-guide',
              `/zh/${page.slugZh || '越南旅游指南'}`,
            ),
          },
        ])}
      />
      <PageHero title={heroTitle} backgroundImage={page.featuredImage ?? undefined} />

      <SectionWrapper fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <PortableTextContent blocks={bodyBlocks} />
          {pdfUrl ? (
            <FileDownloadBlock
              label={pdfLabel}
              url={pdfUrl}
              downloadLabel={t('download')}
            />
          ) : null}
        </div>
      </SectionWrapper>
    </>
  );
}
