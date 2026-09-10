/**
 * News index page — Production Log header + post grid.
 * Figma Blog frame 2050:4920 (desktop).
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BlogCategoryFilter } from '@/components/blog/BlogCategoryFilter';
import { BlogPostGrid } from '@/components/blog/BlogPostGrid';
import { FeaturedPost } from '@/components/blog/FeaturedPost';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
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

  const t = await getTranslations('Blog');
  const pageTitle =
    pickLocaleFieldWithPhrases(typedLocale, page.title, page.titleZh, phrases) ||
    'Production Log';
  const bodyBlocks =
    typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body;
  const featuredPost = posts[0] ?? null;

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
            <div className="vp-news-page__heading">
              <p className="vp-news-page__eyebrow">{`●  ${t('eyebrow')}`}</p>
              <div className="vp-news-page__title-block">
                <h1 className="vp-news-page__title">{pageTitle}</h1>
                {bodyBlocks?.length ? (
                  <div className="vp-news-page__intro">
                    <PortableTextContent blocks={bodyBlocks} />
                  </div>
                ) : null}
              </div>
            </div>
            <BlogCategoryFilter
              categories={categories}
              posts={posts}
              locale={typedLocale}
              phrases={phrases}
            />
          </header>

          {featuredPost ? (
            <FeaturedPost
              post={featuredPost}
              locale={typedLocale}
              phrases={phrases}
            />
          ) : null}

          <BlogPostGrid
            posts={posts}
            locale={typedLocale}
            phrases={phrases}
            excludePostId={featuredPost?._id}
          />
        </div>
      </SectionWrapper>
    </>
  );
}
