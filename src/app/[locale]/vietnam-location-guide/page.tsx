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
  buildOgImage,
  buildPageMetadata,
} from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import {
  buildBreadcrumbs,
  homeBreadcrumb,
  staticPageUrl,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { VIETNAM_LOCATION_GUIDE_PAGE_QUERY } from '@/sanity/queries/pages';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = await sanityClient.fetch(VIETNAM_LOCATION_GUIDE_PAGE_QUERY);
  if (!page) return { title: 'Not Found' };

  const metaTitle = vietnamLocationGuideTitle(locale as Locale);

  return buildPageMetadata({
    locale: locale as Locale,
    enPath: '/vietnam-location-guide',
    zhPath: `/zh/${page.slugZh || '越南旅游指南'}`,
    title: metaTitle,
    description: seoDescription(page.seo ?? undefined, locale as Locale),
    image: buildOgImage(page.featuredImage ?? undefined),
    type: 'website',
  });
}

export default async function VietnamLocationGuidePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const page = await sanityClient.fetch(VIETNAM_LOCATION_GUIDE_PAGE_QUERY);

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

      <SectionWrapper>
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
