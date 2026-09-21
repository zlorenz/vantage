/**
 * Blog post page — root-level /[slug]/ route for SEO preservation.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, permanentRedirect } from '@/i18n/navigation';
import { BlogPostHeroMedia } from '@/components/blog/BlogPostHeroMedia';
import { BlogPostNav } from '@/components/blog/BlogPostNav';
import { BlogShareRow } from '@/components/blog/BlogShareRow';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import {
  blogPostTitle,
  resolveMetadataImage,
  buildPageMetadata,
  seoDescription,
  seoMetaTitle,
} from '@/lib/metadata';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { mergeChineseBodyWithEnglishMedia } from '@/lib/portable-text-media';
import { decodePathSlug, expandSlugParam, canonicalSlugForLocale } from '@/lib/path-slug';
import { getPhraseRecord } from '@/lib/phrase-book';
import { sanityClient } from '@/lib/sanity';
import { absoluteUrl } from '@/lib/sitemap-urls';
import {
  buildArticle,
  buildBreadcrumbs,
  buildOrganization,
  blogPostPageUrl,
  homeBreadcrumb,
  loadOrganizationSchemaInput,
  newsBreadcrumb,
} from '@/lib/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { sanityFetch } from '@/sanity/lib/live';
import { POST_BY_SLUG_QUERY, POST_SLUGS_QUERY, RESERVED_PAGE_SLUGS } from '@/sanity/queries/blog';
import type { BlogPost, PostSlug } from '@/types/sanity';
import '@/components/blog/blog-post-page.css';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await sanityClient.fetch<PostSlug[]>(POST_SLUGS_QUERY);

  return routing.locales.flatMap((locale) =>
    slugs.flatMap((item) => {
      const base = locale === 'zh' ? item.slugZh || item.slug : item.slug;
      return expandSlugParam(base).map((slug) => ({ locale, slug }));
    }),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const slug = decodePathSlug(rawSlug);
  const {data} = await sanityFetch({query: POST_BY_SLUG_QUERY, params: {slug}, stega: false});
  const post = data as BlogPost | null;
  if (!post) return { title: 'Not Found' };

  const title = typedLocale === 'zh' && post.titleZh ? post.titleZh : post.title;
  const titleOverride = seoMetaTitle(post.seo, typedLocale);
  const metaTitle = titleOverride ?? blogPostTitle(title);
  const description = seoDescription(post.seo, typedLocale, {
    excerpt: post.excerpt,
    excerptZh: post.excerptZh,
  });

  return buildPageMetadata({
    locale: typedLocale,
    enPath: `/${post.slug}`,
    zhPath: `/zh/${post.slugZh || post.slug}`,
    title: metaTitle,
    description,
    image: resolveMetadataImage(post.seo, post.featuredImage),
    type: 'article',
    robots: post.noIndex ? { index: false, follow: false } : undefined,
  });
}

function BackArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path
        d="M8.5 2.5 3.5 7l5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  const slug = decodePathSlug(rawSlug);

  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) {
    notFound();
  }

  const typedLocale = locale as Locale;

  const [postResult, phrases, organization, t] = await Promise.all([
    sanityFetch({query: POST_BY_SLUG_QUERY, params: {slug}}),
    getPhraseRecord(),
    loadOrganizationSchemaInput(typedLocale),
    getTranslations('Blog'),
  ]);
  const post = postResult.data as BlogPost | null;

  if (!post) notFound();

  const canonicalSlug = canonicalSlugForLocale(
    typedLocale,
    slug,
    post.slug,
    post.slugZh,
  );
  if (canonicalSlug) {
    permanentRedirect({
      href: {
        pathname: '/[slug]',
        params: { slug: canonicalSlug },
      },
      locale: typedLocale,
    });
  }

  const title = pickLocaleFieldWithPhrases(
    typedLocale,
    post.title,
    post.titleZh,
    phrases,
  );
  const excerpt = pickLocaleFieldWithPhrases(
    typedLocale,
    post.excerpt,
    post.excerptZh,
    phrases,
  );
  const bodyBlocks =
    typedLocale === 'zh' && post.bodyZh?.length
      ? mergeChineseBodyWithEnglishMedia(post.bodyZh, post.body)
      : post.body;

  return (
    <>
      <JsonLd data={buildOrganization(organization)} />
      <JsonLd
        data={buildArticle({
          title,
          excerpt: post.excerpt,
          excerptZh: post.excerptZh,
          featuredImage: post.featuredImage,
          publishedAt: post.publishedAt,
          _updatedAt: post._updatedAt,
          seo: post.seo,
          locale: typedLocale,
        })}
      />
      <JsonLd
        data={buildBreadcrumbs([
          homeBreadcrumb(typedLocale),
          newsBreadcrumb(typedLocale),
          {
            name: title,
            url: blogPostPageUrl(typedLocale, post.slug, post.slugZh),
          },
        ])}
      />
      <SectionWrapper
        className="vp-blog-post !pt-[var(--vp-section-y-header-condensed)]"
        fullBleed={true}
      >
        <article>
          <header className="vp-blog-hero">
            <div className="vp-blog-hero__top">
              <div className="vp-blog-hero__rail">
                <Link href="/news" className="vp-blog-hero__back">
                  <span className="vp-blog-hero__back-icon">
                    <BackArrowIcon />
                  </span>
                  <span className="vp-blog-hero__back-label">{t('allBlog')}</span>
                </Link>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="vp-blog-hero__motif"
                  src="/brand/vap-pattern.svg"
                  alt=""
                  aria-hidden="true"
                />
              </div>

              <div className="vp-blog-hero__copy">
                {post.categories?.length ? (
                  <div className="vp-blog-hero__pills">
                    {post.categories.map((category) => {
                      const catSlug =
                        typedLocale === 'zh'
                          ? category.slugZh || category.slug
                          : category.slug;
                      const catLabel = pickLocaleFieldWithPhrases(
                        typedLocale,
                        category.title,
                        category.titleZh,
                        phrases,
                      );
                      return (
                        <Link
                          key={category._id}
                          href={{
                            pathname: '/category/[slug]',
                            params: { slug: catSlug },
                          }}
                          className="vp-blog-hero__pill"
                        >
                          {catLabel}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}

                <h1 className="vp-blog-hero__title">{title}</h1>
                <hr className="vp-blog-hero__rule" />
                {excerpt ? <p className="vp-blog-hero__dek">{excerpt}</p> : null}
              </div>
            </div>

            <BlogPostHeroMedia
              locale={typedLocale}
              phrases={phrases}
              relatedCase={post.relatedCase}
              mainVideo={post.mainVideo}
              featuredImage={post.featuredImage}
            />
          </header>

          <div className="vp-blog-post__body entry-content">
            <PortableTextContent blocks={bodyBlocks} />
            <BlogShareRow
              url={absoluteUrl(blogPostPageUrl(typedLocale, post.slug, post.slugZh))}
              title={title}
              shareLabel={t('share')}
            />
          </div>

          <BlogPostNav
            currentId={post._id}
            locale={typedLocale}
            readMore={t('readMore')}
          />
        </article>
      </SectionWrapper>
    </>
  );
}
