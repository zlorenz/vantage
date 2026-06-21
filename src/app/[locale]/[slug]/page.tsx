/**
 * Blog post page — root-level /[slug]/ route for SEO preservation.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PortableTextContent } from '@/components/ui/PortableTextContent';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { routing, type Locale } from '@/i18n/routing';
import { blogPostTitle, buildOgImage, seoDescription } from '@/lib/metadata';
import { sanityClient } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY, POST_SLUGS_QUERY, RESERVED_PAGE_SLUGS } from '@/sanity/queries/blog';
import type { BlogPost, PostSlug } from '@/types/sanity';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await sanityClient.fetch<PostSlug[]>(POST_SLUGS_QUERY);

  return routing.locales.flatMap((locale) =>
    slugs.map((item) => ({
      locale,
      slug: locale === 'zh' ? item.slugZh || item.slug : item.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await sanityClient.fetch<BlogPost | null>(POST_BY_SLUG_QUERY, { slug });
  if (!post) return { title: 'Not Found' };

  const title = locale === 'zh' && post.titleZh ? post.titleZh : post.title;

  return {
    title: blogPostTitle(title),
    description: seoDescription(post.seo, locale as Locale),
    openGraph: {
      title: blogPostTitle(title),
      description: seoDescription(post.seo, locale as Locale),
      images: buildOgImage(post.featuredImage),
    },
    alternates: {
      languages: {
        en: `/${post.slug}`,
        zh: `/zh/${post.slugZh || post.slug}`,
      },
    },
  };
}

function formatDate(dateString: string, locale: Locale): string {
  return new Date(dateString).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) {
    notFound();
  }

  const typedLocale = locale as Locale;

  const post = await sanityClient.fetch<BlogPost | null>(POST_BY_SLUG_QUERY, { slug });

  if (!post) notFound();

  const title = typedLocale === 'zh' && post.titleZh ? post.titleZh : post.title;
  const bodyBlocks =
    typedLocale === 'zh' && post.bodyZh?.length ? post.bodyZh : post.body;

  return (
    <SectionWrapper className="vp-single-post">
      <div className="container-fluid mx-auto max-w-[900px] px-3 md:px-4">
        <article>
          <header className="entry-header mb-8">
            <h1 className="entry-title mb-4 text-[clamp(2rem,3vw,2.75rem)] font-bold uppercase leading-tight tracking-vp-heading">
              {title}
            </h1>
            <div className="entry-meta flex flex-wrap items-center gap-2 text-sm text-vp-text-soft">
              {post.publishedAt ? (
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, typedLocale)}</time>
              ) : null}
              {post.categories?.length ? (
                <>
                  <span aria-hidden>·</span>
                  {post.categories.map((category) => {
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
                </>
              ) : null}
            </div>
          </header>

          <div className="entry-content">
            <PortableTextContent blocks={bodyBlocks} />
          </div>
        </article>
      </div>
    </SectionWrapper>
  );
}
