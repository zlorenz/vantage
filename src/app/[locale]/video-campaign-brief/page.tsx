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
  buildOgImage,
  campaignBriefPageTitle,
  seoDescription,
  buildPageMetadata,
} from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import {
  buildBreadcrumbs,
  homeBreadcrumb,
  staticPageUrl,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
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
    slug: 'video-campaign-brief',
  });
  if (!page) return { title: 'Not Found' };

  return buildPageMetadata({
    locale: locale as Locale,
    enPath: '/video-campaign-brief',
    zhPath: `/zh/${page.slugZh || '视频活动简介'}`,
    title: campaignBriefPageTitle(locale as Locale),
    description: seoDescription(page.seo, locale as Locale),
    image: buildOgImage(page.featuredImage),
    type: 'website',
  });
}

export default async function VideoCampaignBriefPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, {
    slug: 'video-campaign-brief',
  });

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
            name: title,
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
          <h1 className="text-[clamp(2rem,3vw,2.75rem)] font-bold uppercase tracking-vp-heading">
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
