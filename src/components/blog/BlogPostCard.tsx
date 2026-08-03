/**
 * BlogPostCard — news index and category archive list card.
 */

import Image from 'next/image';
import { BlogPostedOn } from '@/components/blog/BlogPostedOn';
import { Link } from '@/i18n/navigation';
import { resolveBlogCardExcerpt } from '@/lib/blog-excerpt';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { urlForImage } from '@/lib/sanity';
import type { BlogPostCard as BlogPostCardData } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

interface BlogPostCardProps {
  post: BlogPostCardData;
  locale: Locale;
  phrases?: Record<string, string>;
}

export function BlogPostCard({ post, locale, phrases }: BlogPostCardProps) {
  const slugParam = locale === 'zh' ? post.slugZh || post.slug : post.slug;
  const title = pickLocaleFieldWithPhrases(locale, post.title, post.titleZh, phrases);
  const excerpt = resolveBlogCardExcerpt(
    pickLocaleFieldWithPhrases(locale, post.excerpt, post.excerptZh, phrases),
    pickLocaleFieldWithPhrases(locale, post.bodyText, post.bodyTextZh, phrases),
  );

  const imageUrl = post.featuredImage
    ? urlForImage(post.featuredImage).width(960).height(540).fit('crop').url()
    : null;

  return (
    <article className="vp-post-card">
      {imageUrl ? (
        <Link
          href={{ pathname: '/[slug]', params: { slug: slugParam } }}
          className="vp-post-card__thumb block aspect-video overflow-hidden bg-vp-search-thumb-bg"
          aria-label={title}
        >
          <Image
            src={imageUrl}
            alt=""
            width={960}
            height={540}
            className="h-full w-full object-cover"
          />
        </Link>
      ) : null}

      <div className="vp-post-card__body pt-4 md:pt-5">
        <h2 className="vp-post-card__title m-0 mb-1 font-vp-heading text-[clamp(1.4rem,2vw,2.25rem)] font-bold uppercase leading-tight tracking-vp-heading">
          <Link
            href={{ pathname: '/[slug]', params: { slug: slugParam } }}
            className="text-inherit no-underline hover:opacity-80"
          >
            {title}
          </Link>
        </h2>

        {post.publishedAt ? (
          <div className="vp-post-card__meta mb-2 text-sm text-vp-text-soft">
            <BlogPostedOn publishedAt={post.publishedAt} locale={locale} />
          </div>
        ) : null}

        {excerpt ? (
          <div className="vp-post-card__excerpt font-light text-vp-text-muted">
            <p className="m-0">{excerpt}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
