/**
 * News index page — hero, intro, blog post grid with sidebar.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { PageHero } from '@/components/ui/PageHero';
import { PortableTextIntro } from '@/components/ui/PortableTextIntro';
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

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle || 'News <span class="vp-outline">& Insights</span>';

  const introBlocks =
    typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body;

  return (
    <>
      <JsonLd data={buildOrganization(organization)} />
      <JsonLd
        data={buildCollectionPage({
          name: heroTitle,
          description: seoDescription(page.seo ?? undefined, typedLocale),
          image: page.featuredImage ?? undefined,
          url: newsBreadcrumb(typedLocale).url,
          locale: typedLocale,
        })}
      />
      <JsonLd
        data={buildBreadcrumbs([homeBreadcrumb(typedLocale), newsBreadcrumb(typedLocale)])}
      />
      <PageHero title={heroTitle} backgroundImage={page.featuredImage ?? undefined} />

      <SectionWrapper className="vp-news-page" fullBleed={true}>
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="vp-news-intro mb-12 max-w-[900px] font-light text-vp-text-muted">
                <PortableTextIntro blocks={introBlocks ?? undefined} />
              </div>

              <div className="vp-news-posts flex flex-col gap-16">
                {posts.map((post) => (
                  <BlogPostCard
                    key={post._id}
                    post={post}
                    locale={typedLocale}
                    phrases={phrases}
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <BlogSidebar categories={categories} locale={typedLocale} phrases={phrases} />
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
