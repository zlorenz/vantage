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
import { newsPageTitle, seoDescription, buildOgImage, buildPageMetadata } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import { buildBreadcrumbs, homeBreadcrumb, newsBreadcrumb } from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { ALL_CATEGORIES_QUERY, ALL_POSTS_QUERY } from '@/sanity/queries/blog';
import { PAGE_BY_SLUG_QUERY } from '@/sanity/queries/pages';
import type { BlogPostCard as BlogPostCardData, CategoryTerm, PageDocument } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = await sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, {
    slug: 'news',
  });

  return buildPageMetadata({
    locale: locale as Locale,
    enPath: '/news',
    zhPath: `/zh/${page?.slugZh || '新闻'}`,
    title: newsPageTitle(),
    description: seoDescription(page?.seo, locale as Locale),
    image: buildOgImage(page?.featuredImage),
    type: 'website',
  });
}

export default async function NewsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const [page, posts, categories] = await Promise.all([
    sanityClient.fetch<PageDocument | null>(PAGE_BY_SLUG_QUERY, { slug: 'news' }),
    sanityClient.fetch<BlogPostCardData[]>(ALL_POSTS_QUERY),
    sanityClient.fetch<CategoryTerm[]>(ALL_CATEGORIES_QUERY),
  ]);

  if (!page) notFound();

  const heroTitle =
    typedLocale === 'zh' && page.heroTitleZh
      ? page.heroTitleZh
      : page.heroTitle || 'News <span class="vp-outline">& Insights</span>';

  const introBlocks =
    typedLocale === 'zh' && page.bodyZh?.length ? page.bodyZh : page.body;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs([homeBreadcrumb(typedLocale), newsBreadcrumb(typedLocale)])}
      />
      <PageHero title={heroTitle} backgroundImage={page.featuredImage} />

      <SectionWrapper className="vp-news-page">
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="vp-news-intro mb-12 max-w-[900px] font-light text-vp-text-muted">
                <PortableTextIntro blocks={introBlocks} />
              </div>

              <div className="vp-news-posts flex flex-col gap-16">
                {posts.map((post) => (
                  <BlogPostCard key={post._id} post={post} locale={typedLocale} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <BlogSidebar categories={categories} locale={typedLocale} />
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
