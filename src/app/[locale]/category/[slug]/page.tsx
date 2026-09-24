/**
 * Blog category archive — filtered post grid with sidebar.
 * Mobile ≤575: chrome-chip filter (nested sheet) + full-bleed cards;
 * sidebar hidden. Desktop keeps PageHero + sidebar.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { BlogCategoryFilter } from '@/components/blog/BlogCategoryFilter';
import { BlogPostGrid } from '@/components/blog/BlogPostGrid';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { PageHero } from '@/components/ui/PageHero';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { permanentRedirect } from '@/i18n/navigation';
import { decodeHtmlEntities } from '@/lib/decode-html-entities';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { taxonomyArchiveTitle, blogCategoryDescription, buildPageMetadata } from '@/lib/metadata';
import { decodePathSlug, expandSlugParam, canonicalSlugForLocale } from '@/lib/path-slug';
import { getPhraseRecord } from '@/lib/phrase-book';
import { sanityClient } from '@/lib/sanity';
import {
  buildBreadcrumbs,
  buildCollectionPage,
  buildOrganization,
  categoryPageUrl,
  homeBreadcrumb,
  loadOrganizationSchemaInput,
  newsBreadcrumb,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  ALL_CATEGORIES_QUERY,
  ALL_POSTS_QUERY,
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
    categories.flatMap((category) => {
      const base = locale === 'zh' ? category.slugZh || category.slug : category.slug;
      return expandSlugParam(base).map((slug) => ({ locale, slug }));
    }),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decodePathSlug(rawSlug);
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
    description: blogCategoryDescription(title, locale as Locale),
    type: 'website',
  });
}

export default async function CategoryArchivePage({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  const slug = decodePathSlug(rawSlug);

  const typedLocale = locale as Locale;

  const category = await sanityClient.fetch<CategoryTerm | null>(CATEGORY_BY_SLUG_QUERY, {
    slug,
  });

  if (!category) notFound();

  const canonicalSlug = canonicalSlugForLocale(
    typedLocale,
    slug,
    category.slug,
    category.slugZh,
  );
  if (canonicalSlug) {
    permanentRedirect({
      href: {
        pathname: '/category/[slug]',
        params: { slug: canonicalSlug },
      },
      locale: typedLocale,
    });
  }

  const [posts, allPosts, categories, heroImage, phrases, organization] = await Promise.all([
    sanityClient.fetch<BlogPostCardData[]>(POSTS_BY_CATEGORY_QUERY, { slug }),
    sanityClient.fetch<BlogPostCardData[]>(ALL_POSTS_QUERY),
    sanityClient.fetch<CategoryTerm[]>(ALL_CATEGORIES_QUERY),
    sanityClient.fetch<SanityImage | null>(CATEGORY_HERO_IMAGE_QUERY, { slug }),
    getPhraseRecord(),
    loadOrganizationSchemaInput(typedLocale),
  ]);

  const heroTitle = decodeHtmlEntities(
    pickLocaleFieldWithPhrases(
      typedLocale,
      category.title,
      category.titleZh,
      phrases,
    ),
  );

  const activeSlug =
    typedLocale === 'zh' ? category.slugZh || category.slug : category.slug;

  const pageUrl = categoryPageUrl(typedLocale, category.slug, category.slugZh);

  return (
    <>
      <JsonLd data={buildOrganization(organization)} />
      <JsonLd
        data={buildCollectionPage({
          name: heroTitle,
          description: blogCategoryDescription(heroTitle, typedLocale),
          image: heroImage ?? undefined,
          url: pageUrl,
          locale: typedLocale,
        })}
      />
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          newsBreadcrumb(typedLocale),
          {
            name: heroTitle,
            url: pageUrl,
          },
        ])}
      />
      <div className="vp-category-archive">
        <PageHero title={heroTitle} backgroundImage={heroImage ?? undefined} />

        <SectionWrapper className="vp-news-page vp-category-archive__body" fullBleed={true}>
          {/* Mobile-only filter chip — desktop keeps BlogSidebar. */}
          <div className="vp-category-archive__toolbar">
            <BlogCategoryFilter
              categories={categories}
              posts={allPosts}
              locale={typedLocale}
              phrases={phrases}
              activeSlug={activeSlug}
            />
          </div>

          <div className="vp-category-archive__layout">
            <div className="vp-category-archive__main">
              <BlogPostGrid
                posts={posts}
                locale={typedLocale}
                phrases={phrases}
              />
            </div>

            <div className="vp-category-archive__aside">
              <BlogSidebar
                categories={categories}
                locale={typedLocale}
                activeSlug={activeSlug}
                phrases={phrases}
              />
            </div>
          </div>
        </SectionWrapper>
      </div>
    </>
  );
}
