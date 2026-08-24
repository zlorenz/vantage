/**
 * Awards page — hero, body intro, and a list of award entries.
 *
 * Mirrors the our-industry page structure (PAGE_META_FIELDS +
 * PAGE_CONTENT_FIELDS against the `awards` page doc). Award entries render
 * at standard content-section weight (not the buried/low-weight treatment)
 * since this is real page content once populated with actual results —
 * currently placeholder/invented entries pending real award data.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { pageTitle, seoDescription, resolveMetadataImage, buildPageMetadata, seoMetaTitle } from '@/lib/metadata';
import { getPhraseRecord } from '@/lib/phrase-book';
import { buildBreadcrumbs, homeBreadcrumb, staticPageUrl } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { sanityFetch } from '@/sanity/lib/live';
import { AWARDS_PAGE_QUERY } from '@/sanity/queries/pages';
import type { AWARDS_PAGE_QUERY_RESULT } from '@/sanity/sanity.types';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const { data } = await sanityFetch({ query: AWARDS_PAGE_QUERY, stega: false });
  const page = data as AWARDS_PAGE_QUERY_RESULT;
  if (!page) return { title: 'Not Found' };

  const title = typedLocale === 'zh' && page.titleZh ? page.titleZh : page.title;
  const metaTitle = seoMetaTitle(page.seo ?? undefined, typedLocale) ?? pageTitle(title ?? '');

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/awards',
    // PLACEHOLDER — no real Chinese slug yet; matches the placeholder zh
    // pathname registered in src/i18n/routing.ts.
    zhPath: `/zh/${page.slugZh || 'awards'}`,
    title: metaTitle,
    description: seoDescription(page.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(page.seo ?? undefined, page.featuredImage ?? undefined),
    type: 'website',
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function AwardsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [pageResult, phrases] = await Promise.all([
    sanityFetch({ query: AWARDS_PAGE_QUERY }),
    getPhraseRecord(),
  ]);
  const page = pageResult.data as AWARDS_PAGE_QUERY_RESULT;

  if (!page) notFound();

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle || 'Our <span class="vp-outline">Awards</span>';

  const bodyBlocks = typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body;

  const pageTitleLabel = pickLocaleFieldWithPhrases(typedLocale, page.title, page.titleZh, phrases);
  const pageUrl = staticPageUrl(typedLocale, '/awards', '/zh/awards');
  const awardItems = page.awardItems ?? [];

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

      {awardItems.length ? (
        <SectionWrapper borderTop fullBleed={true}>
          <div className="container-fluid mx-auto max-w-[1200px] px-3 md:px-4">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {awardItems.map((item) => {
                const title =
                  (typedLocale === 'zh' && item.titleZh ? item.titleZh : item.title) ?? '';
                const category =
                  (typedLocale === 'zh' && item.categoryZh ? item.categoryZh : item.category) ??
                  '';
                return (
                  <div
                    key={item._key}
                    className="border border-vp-border-soft p-6"
                  >
                    <h3 className="mb-2 font-vp-heading text-lg font-bold uppercase leading-tight tracking-vp-heading">
                      {title}
                    </h3>
                    <p className="m-0 text-sm font-light text-vp-text-muted">
                      {[category, item.year].filter(Boolean).join(' — ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionWrapper>
      ) : null}
    </>
  );
}
