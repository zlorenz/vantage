/**
 * Video Campaign Brief page — 7-step lead generation form.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { CampaignBriefForm } from '@/components/forms/CampaignBriefForm';
import { CondensedPageHeader } from '@/components/ui/CondensedPageHeader';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { getCampaignBriefUi } from '@/lib/campaign-brief-i18n';
import {
  resolveMetadataImage,
  campaignBriefPageTitle,
  seoDescription,
  buildPageMetadata,
  seoMetaTitle,
} from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import {
  buildBreadcrumbs,
  homeBreadcrumb,
  staticPageUrl,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { VIDEO_CAMPAIGN_BRIEF_PAGE_QUERY } from '@/sanity/queries/pages';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const page = await sanityClient.fetch(VIDEO_CAMPAIGN_BRIEF_PAGE_QUERY);
  if (!page) return { title: 'Not Found' };

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/video-campaign-brief',
    zhPath: `/zh/${page.slugZh || '视频活动简介'}`,
    title:
      seoMetaTitle(page.seo ?? undefined, typedLocale) ??
      campaignBriefPageTitle(typedLocale),
    description: seoDescription(page.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(page.seo ?? undefined, page.featuredImage ?? undefined),
    type: 'website',
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function VideoCampaignBriefPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await sanityClient.fetch(VIDEO_CAMPAIGN_BRIEF_PAGE_QUERY);

  if (!page) notFound();

  const typedLocale = locale as Locale;
  const title =
    typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;
  const ui = getCampaignBriefUi(typedLocale);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          {
            name: title ?? '',
            url: staticPageUrl(
              typedLocale,
              '/video-campaign-brief',
              `/zh/${page.slugZh || '视频活动简介'}`,
            ),
          },
        ])}
      />
      <CondensedPageHeader>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <h1 className="font-vp-heading text-[clamp(2.375rem,4.3vw,3.4375rem)] font-bold uppercase tracking-vp-heading">
            {title}
          </h1>
        </div>
      </CondensedPageHeader>

      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <p className="mb-8 font-light text-vp-text-muted">{ui.formDescription}</p>
          <CampaignBriefForm />
        </div>
      </SectionWrapper>
    </>
  );
}
