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
import { portfolioEntryMetadata } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
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
    slugs.map((entry) => ({
      locale,
      slug: locale === 'zh' ? entry.slugZh || entry.slug : entry.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const [entry, siteSettings] = await Promise.all([
    sanityClient.fetch<PortfolioEntry | null>(PORTFOLIO_ENTRY_QUERY, { slug }),
    sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
  ]);

  if (!entry || entry.isHidden) {
    return { title: 'Not Found' };
  }

  return portfolioEntryMetadata(
    entry,
    locale as Locale,
    siteSettings?.defaultOgImage,
  );
}

export default async function PortfolioEntryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const entry = await sanityClient.fetch<PortfolioEntry | null>(
    PORTFOLIO_ENTRY_QUERY,
    { slug },
  );

  if (!entry || entry.isHidden) {
    notFound();
  }

  const description =
    typedLocale === 'zh' && entry.descriptionZh
      ? entry.descriptionZh
      : entry.description;

  return (
    <>
      <PageHero
        title={entry.headerTitle}
        backgroundImage={entry.featuredImage}
      />
      <SectionWrapper>
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
            <div className="order-2 lg:order-1 lg:col-span-4 lg:col-start-2">
              <h2
                className="mb-3 text-2xl font-bold uppercase leading-tight tracking-vp-heading"
                dangerouslySetInnerHTML={{ __html: entry.longTitle }}
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
          </div>
          <div className="mt-8 lg:col-span-10 lg:col-start-2">
            <PortfolioCredits credits={entry.credits} />
          </div>
        </div>
      </SectionWrapper>

      {entry.additionalVideos?.map((video, index) => {
        const hasVideo =
          video.vimeoUrl?.trim() ||
          (typedLocale === 'zh' && video.xinpianchangUrl?.trim());
        if (!hasVideo) return null;

        return (
          <SectionWrapper key={index} borderTop>
            <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
                <div className="order-2 lg:order-1 lg:col-span-4 lg:col-start-2">
                  {video.longTitle ? (
                    <h2
                      className="mb-3 text-2xl font-bold uppercase leading-tight tracking-vp-heading"
                      dangerouslySetInnerHTML={{ __html: video.longTitle }}
                    />
                  ) : null}
                  {video.description ? (
                    <div className="mb-4 whitespace-pre-wrap font-light text-vp-text-muted">
                      {video.description}
                    </div>
                  ) : null}
                </div>
                <div className="order-1 lg:order-2 lg:col-span-7">
                  <PortfolioVideoEmbed
                    locale={typedLocale}
                    vimeoUrl={video.vimeoUrl}
                    xinpianchangUrl={video.xinpianchangUrl}
                    featuredImage={entry.featuredImage}
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
