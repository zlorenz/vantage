/**
 * Our Industry page — hero, body, and link hubs to the industry / market /
 * video-format taxonomy archives.
 *
 * Mirrors the vietnam-production-service page structure (PAGE_META_FIELDS +
 * PAGE_CONTENT_FIELDS against the `our-industry` page doc) but has no
 * featuredWork field — this page is a plain-link index, not a curated grid.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { pageTitle, seoDescription, resolveMetadataImage, buildPageMetadata, seoMetaTitle } from '@/lib/metadata';
import { getPhraseRecord } from '@/lib/phrase-book';
import { buildBreadcrumbs, homeBreadcrumb, staticPageUrl } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { sanityFetch } from '@/sanity/lib/live';
import { sanityClient } from '@/lib/sanity';
import { OUR_INDUSTRY_PAGE_QUERY } from '@/sanity/queries/pages';
import { INDUSTRIES_QUERY, MARKETS_QUERY, VIDEO_FORMATS_QUERY } from '@/sanity/queries/portfolio';
import type { OUR_INDUSTRY_PAGE_QUERY_RESULT } from '@/sanity/sanity.types';
import type { TaxonomyTerm } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const { data } = await sanityFetch({ query: OUR_INDUSTRY_PAGE_QUERY, stega: false });
  const page = data as OUR_INDUSTRY_PAGE_QUERY_RESULT;
  if (!page) return { title: 'Not Found' };

  const title = typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;
  const metaTitle = seoMetaTitle(page.seo ?? undefined, typedLocale) ?? pageTitle(title ?? '');

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/our-industry',
    // PLACEHOLDER — no real Chinese slug yet; matches the placeholder zh
    // pathname registered in src/i18n/routing.ts.
    zhPath: `/zh/${page.slugZh || 'our-industry'}`,
    title: metaTitle,
    description: seoDescription(page.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(page.seo ?? undefined, page.featuredImage ?? undefined),
    type: 'website',
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  });
}

/** Term list section — plain link list, "buried" low-visual-weight treatment. */
function TermLinkSection({
  headingLabel,
  terms,
  pathname,
  locale,
  phrases,
}: {
  headingLabel: string;
  terms: TaxonomyTerm[];
  pathname: '/industry/[slug]' | '/market/[slug]' | '/video-format/[slug]';
  locale: Locale;
  phrases: Record<string, string>;
}) {
  if (!terms.length) return null;

  return (
    <SectionWrapper variant="tight" borderTop fullBleed={true}>
      <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
        <h2 className="mb-3 font-vp-heading text-xs font-normal uppercase tracking-vp-heading text-vp-text-soft">
          {headingLabel}
        </h2>
        <ul className="m-0 flex flex-wrap gap-x-4 gap-y-2 list-none p-0">
          {terms.map((term) => {
            const slug = locale === 'zh' ? term.slugZh || term.slug : term.slug;
            const label = decodeHtmlEntities(
              pickLocaleFieldWithPhrases(locale, term.title, term.titleZh, phrases),
            );
            return (
              <li key={term._id}>
                <Link
                  href={{ pathname, params: { slug } }}
                  className="text-sm text-vp-link no-underline hover:text-vp-link-hover hover:underline"
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </SectionWrapper>
  );
}

export default async function OurIndustryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [pageResult, industries, markets, videoFormats, phrases] = await Promise.all([
    sanityFetch({ query: OUR_INDUSTRY_PAGE_QUERY }),
    sanityClient.fetch<TaxonomyTerm[]>(INDUSTRIES_QUERY),
    sanityClient.fetch<TaxonomyTerm[]>(MARKETS_QUERY),
    sanityClient.fetch<TaxonomyTerm[]>(VIDEO_FORMATS_QUERY),
    getPhraseRecord(),
  ]);
  const page = pageResult.data as OUR_INDUSTRY_PAGE_QUERY_RESULT;

  if (!page) notFound();

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle || 'Our <span class="vp-outline">Industry</span>';

  const bodyBlocks = typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body;

  const pageTitleLabel = pickLocaleFieldWithPhrases(typedLocale, page.title, page.titleZh, phrases);
  const pageUrl = staticPageUrl(typedLocale, '/our-industry', '/zh/our-industry');
  const t = await getTranslations('OurIndustry');

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          { name: pageTitleLabel, url: pageUrl },
        ])}
      />
      <PageHero title={heroTitle} backgroundImage={page.featuredImage ?? undefined} />

      <SectionWrapper fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
          <PortableTextContent blocks={bodyBlocks} />
        </div>
      </SectionWrapper>

      <TermLinkSection
        headingLabel={t('industriesHeading')}
        terms={industries}
        pathname="/industry/[slug]"
        locale={typedLocale}
        phrases={phrases}
      />
      <TermLinkSection
        headingLabel={t('marketsHeading')}
        terms={markets}
        pathname="/market/[slug]"
        locale={typedLocale}
        phrases={phrases}
      />
      <TermLinkSection
        headingLabel={t('videoFormatsHeading')}
        terms={videoFormats}
        pathname="/video-format/[slug]"
        locale={typedLocale}
        phrases={phrases}
      />
    </>
  );
}
