/**
 * Single portfolio entry page — hero, two-column layout, credits, additional videos.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/ui/PageHero';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { PortfolioCredits } from '@/components/portfolio/PortfolioCredits';
import { PortfolioVideoEmbed } from '@/components/portfolio/PortfolioVideoEmbed';
import { routing, type Locale } from '@/i18n/routing';
import { pickLocaleField } from '@/lib/locale-field';
import { portfolioEntryMetadata } from '@/lib/metadata';
import { decodePathSlug, expandSlugParam } from '@/lib/path-slug';
import { sanityClient } from '@/lib/sanity';
import {
  buildBreadcrumbs,
  buildVideoObject,
  homeBreadcrumb,
  portfolioPageUrl,
  workBreadcrumb,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_SETTINGS_QUERY } from '@/sanity/queries/global';
import {
  PORTFOLIO_ENTRY_QUERY,
  PORTFOLIO_SLUGS_QUERY,
} from '@/sanity/queries/portfolio';
import type { PortfolioEntry, PortfolioSlug, SiteSettings } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await sanityClient.fetch<PortfolioSlug[]>(PORTFOLIO_SLUGS_QUERY);

  return routing.locales.flatMap((locale) =>
    slugs.flatMap((entry) => {
      const base = locale === 'zh' ? entry.slugZh || entry.slug : entry.slug;
      return expandSlugParam(base).map((slug) => ({ locale, slug }));
    }),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decodePathSlug(rawSlug);
  const [entry, siteSettings] = await Promise.all([
    sanityClient.fetch<PortfolioEntry | null>(PORTFOLIO_ENTRY_QUERY, { slug }),
    sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
  ]);

  if (!entry) {
    return { title: 'Not Found' };
  }

  return portfolioEntryMetadata(
    entry,
    locale as Locale,
    siteSettings?.defaultOgImage,
  );
}

export default async function PortfolioEntryPage({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  const slug = decodePathSlug(rawSlug);

  const typedLocale = locale as Locale;
  const entry = await sanityClient.fetch<PortfolioEntry | null>(
    PORTFOLIO_ENTRY_QUERY,
    { slug },
  );

  if (!entry) {
    notFound();
  }

  const description =
    typedLocale === 'zh' && entry.descriptionZh
      ? entry.descriptionZh
      : entry.description;

  const title =
    typedLocale === 'zh' && entry.titleZh ? entry.titleZh : entry.title;

  const headerTitle = pickLocaleField(
    typedLocale,
    entry.headerTitle,
    entry.headerTitleZh,
  );
  const longTitle = pickLocaleField(
    typedLocale,
    entry.longTitle,
    entry.longTitleZh,
  );

  const breadcrumbItems = [
    homeBreadcrumb(typedLocale),
    workBreadcrumb(typedLocale),
    {
      name: title,
      url: portfolioPageUrl(typedLocale, entry.slug, entry.slugZh),
    },
  ];

  return (
    <>
      {entry.vimeoUrl?.trim() ? (
        <JsonLd
          data={buildVideoObject({
            title,
            description,
            featuredImage: entry.featuredImage,
            publishedAt: entry.publishedAt,
            vimeoUrl: entry.vimeoUrl,
          })}
        />
      ) : null}
      <JsonLd data={buildBreadcrumbs(breadcrumbItems)} />
      <PageHero
        title={headerTitle}
        backgroundImage={entry.featuredImage}
      />
      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
            <div className="order-2 lg:order-1 lg:col-span-5">
              <h2
                className="mb-3 text-2xl font-bold uppercase leading-tight tracking-vp-heading"
                dangerouslySetInnerHTML={{ __html: longTitle }}
              />
              {description ? (
                <div className="mb-4 whitespace-pre-wrap font-light text-vp-text-muted">
                  {description}
                </div>
              ) : null}
            </div>
            <div className="order-1 lg:order-2 lg:col-span-7">
              <PortfolioVideoEmbed
                locale={typedLocale}
                vimeoUrl={entry.vimeoUrl}
                xinpianchangUrl={entry.xinpianchangUrl}
                featuredImage={entry.featuredImage}
              />
            </div>
            <div className="order-3 mt-8 lg:col-span-10">
              <PortfolioCredits credits={entry.credits} locale={typedLocale} />
            </div>
          </div>
        </div>
      </SectionWrapper>

      {entry.additionalVideos?.map((video, index) => {
        const hasVideo =
          video.vimeoUrl?.trim() ||
          (typedLocale === 'zh' && video.xinpianchangUrl?.trim());
        if (!hasVideo) return null;

        const videoTitle = pickLocaleField(
          typedLocale,
          video.longTitle,
          video.longTitleZh,
        );
        const videoDescription = pickLocaleField(
          typedLocale,
          video.description,
          video.descriptionZh,
        ).replace(/<\/?p\b[^>]*>/gi, '').trim();

        return (
          <SectionWrapper
            key={video.vimeoUrl || video.xinpianchangUrl || index}
            borderTop
          >
            <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
                <div className="order-2 lg:order-1 lg:col-span-5">
                  {videoTitle ? (
                    <h2
                      className="mb-3 text-2xl font-bold uppercase leading-tight tracking-vp-heading"
                      dangerouslySetInnerHTML={{ __html: videoTitle }}
                    />
                  ) : null}
                  {videoDescription ? (
                    <div className="mb-4 whitespace-pre-wrap font-light text-vp-text-muted">
                      {videoDescription}
                    </div>
                  ) : null}
                </div>
                <div className="order-1 lg:order-2 lg:col-span-7">
                  <PortfolioVideoEmbed
                    locale={typedLocale}
                    vimeoUrl={video.vimeoUrl}
                    xinpianchangUrl={video.xinpianchangUrl}
                  />
                </div>
              </div>
            </div>
          </SectionWrapper>
        );
      })}
    </>
  );
}
