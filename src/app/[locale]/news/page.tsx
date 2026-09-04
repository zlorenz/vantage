/**
 * News index page — Production Log title + three-column masonry post grid.
 * PageHero / intro body remain in Sanity for possible later return; not rendered here.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BlogCategoryFilter } from '@/components/blog/BlogCategoryFilter';
import { BlogPostMasonry } from '@/components/blog/BlogPostMasonry';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { newsPageTitle, seoDescription, resolveMetadataImage, buildPageMetadata, seoMetaTitle } from '@/lib/metadata';
import { getPhraseRecord } from '@/lib/phrase-book';
import {
  buildBreadcrumbs,
  buildCollectionPage,
  buildOrganization,
  homeBreadcrumb,
  loadOrganizationSchemaInput,
  newsBreadcrumb,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { sanityFetch } from '@/sanity/lib/live';
import { ALL_CATEGORIES_QUERY, ALL_POSTS_QUERY } from '@/sanity/queries/blog';
import { NEWS_PAGE_QUERY } from '@/sanity/queries/pages';
import type { NEWS_PAGE_QUERY_RESULT } from '@/sanity/sanity.types';
import type { BlogPostCard as BlogPostCardData, CategoryTerm } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const {data} = await sanityFetch({query: NEWS_PAGE_QUERY, stega: false});
  const page = data as NEWS_PAGE_QUERY_RESULT;

  return buildPageMetadata({
    locale: typedLocale,
    enPath: '/news',
    zhPath: `/zh/${page?.slugZh || '新闻'}`,
    title: seoMetaTitle(page?.seo ?? undefined, typedLocale) ?? newsPageTitle(typedLocale),
    description: seoDescription(page?.seo ?? undefined, typedLocale),
    image: resolveMetadataImage(page?.seo ?? undefined, page?.featuredImage ?? undefined),
    type: 'website',
    robots: page?.noIndex ? { index: false, follow: false } : undefined,
  });
}

export default async function NewsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [pageResult, postsResult, categoriesResult, phrases, organization] = await Promise.all([
    sanityFetch({query: NEWS_PAGE_QUERY}),
    sanityFetch({query: ALL_POSTS_QUERY, stega: false}),
    sanityFetch({query: ALL_CATEGORIES_QUERY, stega: false}),
    getPhraseRecord(),
    loadOrganizationSchemaInput(typedLocale),
  ]);
  const page = pageResult.data as NEWS_PAGE_QUERY_RESULT;
  const posts = postsResult.data as BlogPostCardData[];
  const categories = categoriesResult.data as CategoryTerm[];

  if (!page) notFound();

  const pageTitle = 'Production Log';

  return (
    <>
      <JsonLd data={buildOrganization(organization)} />
      <JsonLd
        data={buildCollectionPage({
          name: pageTitle,
          description: seoDescription(page.seo ?? undefined, typedLocale),
          image: page.featuredImage ?? undefined,
          url: newsBreadcrumb(typedLocale).url,
          locale: typedLocale,
        })}
      />
      <JsonLd
        data={buildBreadcrumbs([homeBreadcrumb(typedLocale), newsBreadcrumb(typedLocale)])}
      />

      <SectionWrapper
        className="vp-news-page !pt-[var(--vp-section-y-header-condensed)]"
        fullBleed={true}
      >
        <div className="vp-content-rail">
          <header className="vp-news-page__header">
            <h1 className="vp-news-page__title">{pageTitle}</h1>
            <BlogCategoryFilter
              categories={categories}
              locale={typedLocale}
              phrases={phrases}
            />
          </header>

          <BlogPostMasonry
            posts={posts}
            locale={typedLocale}
            phrases={phrases}
          />
        </div>
      </SectionWrapper>
    </>
  );
}
