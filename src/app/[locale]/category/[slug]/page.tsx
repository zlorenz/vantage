/**
 * Blog category archive — filtered post grid with sidebar.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { PageHero } from '@/components/ui/PageHero';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { taxonomyArchiveTitle, blogCategoryDescription, buildPageMetadata } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import {
  buildBreadcrumbs,
  categoryPageUrl,
  homeBreadcrumb,
  newsBreadcrumb,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  ALL_CATEGORIES_QUERY,
  CATEGORY_BY_SLUG_QUERY,
  CATEGORY_HERO_IMAGE_QUERY,
  CATEGORY_SLUGS_QUERY,
  POSTS_BY_CATEGORY_QUERY,
} from '@/sanity/queries/blog';
import type { BlogPostCard as BlogPostCardData, CategoryTerm, SanityImage } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const categories = await sanityClient.fetch<{ slug: string; slugZh?: string }[]>(
    CATEGORY_SLUGS_QUERY,
  );

  return routing.locales.flatMap((locale) =>
    categories.map((category) => ({
      locale,
      slug: locale === 'zh' ? category.slugZh || category.slug : category.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await sanityClient.fetch<CategoryTerm | null>(CATEGORY_BY_SLUG_QUERY, {
    slug,
  });
  if (!category) return { title: 'Not Found' };

  const title = decodeHtmlEntities(
    locale === 'zh' && category.titleZh ? category.titleZh : category.title,
  );

  return buildPageMetadata({
    locale: locale as Locale,
    enPath: `/category/${category.slug}`,
    zhPath: `/zh/类别/${category.slugZh || category.slug}`,
    title: taxonomyArchiveTitle(title),
    description: blogCategoryDescription(title),
    type: 'website',
  });
}

export default async function CategoryArchivePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  const category = await sanityClient.fetch<CategoryTerm | null>(CATEGORY_BY_SLUG_QUERY, {
    slug,
  });

  if (!category) notFound();

  const [posts, categories, heroImage] = await Promise.all([
    sanityClient.fetch<BlogPostCardData[]>(POSTS_BY_CATEGORY_QUERY, { slug }),
    sanityClient.fetch<CategoryTerm[]>(ALL_CATEGORIES_QUERY),
    sanityClient.fetch<SanityImage | null>(CATEGORY_HERO_IMAGE_QUERY, { slug }),
  ]);

  const heroTitle = decodeHtmlEntities(
    typedLocale === 'zh' && category.titleZh ? category.titleZh : category.title,
  );

  const activeSlug =
    typedLocale === 'zh' ? category.slugZh || category.slug : category.slug;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          newsBreadcrumb(typedLocale),
          {
            name: heroTitle,
            url: categoryPageUrl(typedLocale, category.slug, category.slugZh),
          },
        ])}
      />
      <PageHero title={heroTitle} backgroundImage={heroImage ?? undefined} />

      <SectionWrapper className="vp-news-page">
        <div className="container-fluid mx-auto max-w-[1400px] px-3 md:px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="vp-news-posts flex flex-col gap-16">
                {posts.map((post) => (
                  <BlogPostCard key={post._id} post={post} locale={typedLocale} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <BlogSidebar
                categories={categories}
                locale={typedLocale}
                activeSlug={activeSlug}
              />
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
