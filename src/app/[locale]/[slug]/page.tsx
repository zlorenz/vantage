/**
 * Blog post page — root-level /[slug]/ route for SEO preservation.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link, permanentRedirect } from '@/i18n/navigation';
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
import { BlogPostedOn } from '@/components/blog/BlogPostedOn';
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

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);
  const slug = decodePathSlug(rawSlug);

  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) {
    notFound();
  }

  const typedLocale = locale as Locale;

  const [postResult, phrases, organization] = await Promise.all([
    sanityFetch({query: POST_BY_SLUG_QUERY, params: {slug}}),
    getPhraseRecord(),
    loadOrganizationSchemaInput(typedLocale),
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
      <SectionWrapper className="vp-single-post">
      <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
        <article>
          <header className="entry-header mb-8">
            <h1 className="entry-title mb-4 text-[clamp(2rem,3vw,2.75rem)] font-bold uppercase leading-tight tracking-vp-heading">
              {title}
            </h1>
            {post.publishedAt || post.categories?.length ? (
              <div className="entry-meta flex flex-wrap items-center gap-2 text-sm text-vp-text-soft">
                {post.publishedAt ? (
                  <BlogPostedOn publishedAt={post.publishedAt} locale={typedLocale} />
                ) : null}
                {post.publishedAt && post.categories?.length ? (
                  <span aria-hidden>·</span>
                ) : null}
                {post.categories?.map((category) => {
                    const catSlug =
                      typedLocale === 'zh'
                        ? category.slugZh || category.slug
                        : category.slug;
                    const catLabel =
                      typedLocale === 'zh' && category.titleZh
                        ? category.titleZh
                        : category.title;
                    return (
                      <Link
                        key={category._id}
                        href={{
                          pathname: '/category/[slug]',
                          params: { slug: catSlug },
                        }}
                        className="vp-category-pill rounded-sm border border-vp-border-soft px-2 py-0.5 text-xs uppercase no-underline hover:border-vp-border"
                      >
                        {catLabel}
                      </Link>
                    );
                  })}
              </div>
            ) : null}
          </header>

          <div className="entry-content">
            <PortableTextContent blocks={bodyBlocks} />
          </div>
        </article>
      </div>
    </SectionWrapper>
    </>
  );
}
