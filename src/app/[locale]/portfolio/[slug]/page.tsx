/**
 * Single portfolio entry page — case header, full-width video, description, credits.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { PortfolioCaseHeader } from '@/components/portfolio/PortfolioCaseHeader';
import { PortfolioCredits } from '@/components/portfolio/PortfolioCredits';
import { PortfolioDescription } from '@/components/portfolio/PortfolioDescription';
import { PortfolioVideoEmbed } from '@/components/portfolio/PortfolioVideoEmbed';
import { routing, type Locale } from '@/i18n/routing';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import {
  resolveAdditionalVideoTitle,
  resolveEntryDisplayTitles,
} from '@/lib/display-titles';
import { getPhraseMap, getPhraseRecord } from '@/lib/phrase-book';
import { portfolioEntryMetadata } from '@/lib/metadata';
import { decodePathSlug, expandSlugParam, canonicalSlugForLocale } from '@/lib/path-slug';
import { sanityClient } from '@/lib/sanity';
import {
  buildBreadcrumbs,
  buildOrganization,
  buildVideoObject,
  homeBreadcrumb,
  loadOrganizationSchemaInput,
  portfolioPageUrl,
  workBreadcrumb,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { permanentRedirect } from '@/i18n/navigation';
import { SITE_SETTINGS_QUERY } from '@/sanity/queries/global';
import { sanityFetch } from '@/sanity/lib/live';
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
  const [entryResult, siteSettings, phrases] = await Promise.all([
    sanityFetch({query: PORTFOLIO_ENTRY_QUERY, params: {slug}, stega: false}),
    sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY),
    getPhraseRecord(),
  ]);
  const entry = entryResult.data as PortfolioEntry | null;

  if (!entry) {
    return { title: 'Not Found' };
  }

  return portfolioEntryMetadata(
    entry,
    locale as Locale,
    siteSettings?.defaultOgImage,
    phrases,
  );
}

export default async function PortfolioEntryPage({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  const slug = decodePathSlug(rawSlug);

  const typedLocale = locale as Locale;
  const [entryResult, phrases, phraseRecord, organization] = await Promise.all([
    sanityFetch({query: PORTFOLIO_ENTRY_QUERY, params: {slug}}),
    getPhraseMap(),
    getPhraseRecord(),
    loadOrganizationSchemaInput(typedLocale),
  ]);
  const entry = entryResult.data as PortfolioEntry | null;

  if (!entry) {
    notFound();
  }

  const canonicalSlug = canonicalSlugForLocale(
    typedLocale,
    slug,
    entry.slug,
    entry.slugZh,
  );
  if (canonicalSlug) {
    permanentRedirect({
      href: {
        pathname: '/portfolio/[slug]',
        params: { slug: canonicalSlug },
      },
      locale: typedLocale,
    });
  }

  const description = pickLocaleFieldWithPhrases(
    typedLocale,
    entry.description,
    entry.descriptionZh,
    phraseRecord,
  );

  const title = pickLocaleFieldWithPhrases(
    typedLocale,
    entry.title,
    entry.titleZh,
    phraseRecord,
  );

  const { longTitle } = resolveEntryDisplayTitles(
    entry,
    typedLocale,
    phrases,
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
      <JsonLd data={buildOrganization(organization)} />
      {entry.vimeoUrl?.trim() ? (
        <JsonLd
          data={buildVideoObject({
            title,
            description,
            featuredImage: entry.featuredImage,
            publishedAt: entry.publishedAt,
            vimeoUrl: entry.vimeoUrl,
            locale: typedLocale,
            crewCredits: entry.crewCredits,
          })}
        />
      ) : null}
      <JsonLd data={buildBreadcrumbs(breadcrumbItems)} />
      <SectionWrapper
        fullBleed={true}
        className="!pt-[var(--vp-section-y-header-condensed)]"
      >
        <div className="mx-auto w-full max-w-[1680px] px-4 md:px-6 xl:px-8">
          <PortfolioCaseHeader
            locale={typedLocale}
            phrases={phrases}
            displayTitleParts={entry.displayTitleParts}
            videoFormats={entry.videoFormats}
            industries={entry.industries}
            markets={entry.markets}
            crewCredits={entry.crewCredits}
          />
          <div className="vp-case-video overflow-hidden rounded-[1.75rem]">
            <PortfolioVideoEmbed
              locale={typedLocale}
              vimeoUrl={entry.vimeoUrl}
              xinpianchangUrl={entry.xinpianchangUrl}
              featuredImage={entry.featuredImage}
            />
          </div>
          <div className="mt-8 max-w-3xl">
            <h2
              className="mb-3 font-vp-heading text-[clamp(1.375rem,1.1rem+1.2vw,1.75rem)] font-bold uppercase leading-tight tracking-vp-heading"
              dangerouslySetInnerHTML={{ __html: longTitle }}
            />
            {description ? (
              <PortfolioDescription text={description} />
            ) : null}
          </div>
          <div className="mt-8">
            <PortfolioCredits
              crewCredits={entry.crewCredits}
              locale={typedLocale}
              phrases={phraseRecord}
            />
          </div>
        </div>
      </SectionWrapper>

      {entry.additionalVideos?.map((video, index) => {
        const hasVideo =
          video.vimeoUrl?.trim() ||
          (typedLocale === 'zh' && video.xinpianchangUrl?.trim());
        if (!hasVideo) return null;

        const videoTitle = resolveAdditionalVideoTitle(
          entry,
          video,
          typedLocale,
          phrases,
        );
        const videoDescription = pickLocaleFieldWithPhrases(
          typedLocale,
          video.description,
          video.descriptionZh,
          phraseRecord,
        );

        return (
          <SectionWrapper
            key={index}
            borderTop
            fullBleed={true}
          >
            <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
                <div className="order-2 lg:order-1 lg:col-span-5">
                  {videoTitle ? (
                    <h2
                      className="mb-3 font-vp-heading text-[clamp(1.375rem,1.1rem+1.2vw,1.75rem)] font-bold uppercase leading-tight tracking-vp-heading"
                      dangerouslySetInnerHTML={{ __html: videoTitle }}
                    />
                  ) : null}
                  <PortfolioDescription text={videoDescription} />
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
