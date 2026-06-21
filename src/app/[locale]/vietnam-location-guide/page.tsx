/**
 * Vietnam Location Guide page — hero, body, PDF download.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { FileDownloadBlock } from '@/components/ui/FileDownloadBlock';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { pageTitle, seoDescription, buildOgImage } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import { PAGE_BY_SLUG_QUERY } from '@/sanity/queries/pages';
import type { PageDocument } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = await sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, {
    slug: 'vietnam-location-guide',
  });
  if (!page) return { title: 'Not Found' };

  const title = locale === 'zh' && page.titleZh ? page.titleZh : page.title;

  return {
    title: pageTitle(title),
    description: seoDescription(page.seo, locale as Locale),
    openGraph: { images: buildOgImage(page.featuredImage) },
    alternates: {
      languages: {
        en: '/vietnam-location-guide',
        zh: `/zh/${page.slugZh || '越南旅游指南'}`,
      },
    },
  };
}

export default async function VietnamLocationGuidePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const page = await sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, {
    slug: 'vietnam-location-guide',
  });

  if (!page) notFound();

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle ||
        '<span class="vp-outline">Vietnam</span> Location Guidebook';

  const bodyBlocks =
    typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body;

  const pdfUrl = page.pdfDownload?.file?.asset?.url;
  const pdfLabel =
    page.pdfDownload?.label || 'Vietnam_Location_Guide_Vantage_Pictures.pdf';

  return (
    <>
      <PageHero title={heroTitle} backgroundImage={page.featuredImage} />

      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <PortableTextContent blocks={bodyBlocks} />
          {pdfUrl ? <FileDownloadBlock label={pdfLabel} url={pdfUrl} /> : null}
        </div>
      </SectionWrapper>
    </>
  );
}
