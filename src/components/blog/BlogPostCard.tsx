'use client';

/**
 * BlogPostCard — news index and category archive list card.
 * Figma Blog card 2051:5750: fixed 480px image + corner L-brackets.
 */

import Image from 'next/image';
import { BlogPostedOn } from '@/components/blog/BlogPostedOn';
import { Link } from '@/i18n/navigation';
import { resolveBlogCardExcerpt } from '@/lib/blog-excerpt';
import { pickLocaleFieldWithPhrases } from '@/lib/locale-field';
import { urlForImage } from '@/lib/sanity';
import type { BlogPostCard as BlogPostCardData } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';
import './blog-post-card.css';

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
    ? urlForImage(post.featuredImage).width(960).height(480).fit('crop').url()
    : null;

  return (
    <article className="vp-blog-card">
      {imageUrl ? (
        <div className="vp-blog-card__media">
          <Link
            href={{ pathname: '/[slug]', params: { slug: slugParam } }}
            className="vp-blog-card__thumb"
            aria-label={title}
          >
            <Image
              src={imageUrl}
              alt=""
              width={960}
              height={480}
              className="size-full object-cover"
              sizes="(max-width: 767px) 100vw, 50vw"
            />
          </Link>
          <div className="vp-blog-card__brackets" aria-hidden="true">
            <span className="vp-blog-card__bracket vp-blog-card__bracket--tl" />
            <span className="vp-blog-card__bracket vp-blog-card__bracket--tr" />
            <span className="vp-blog-card__bracket vp-blog-card__bracket--br" />
            <span className="vp-blog-card__bracket vp-blog-card__bracket--bl" />
          </div>
        </div>
      ) : null}

      <div className="vp-blog-card__body">
        <div className="vp-blog-card__copy">
          <h2 className="vp-blog-card__title vp-blog-card__title--legacy">
            <Link href={{ pathname: '/[slug]', params: { slug: slugParam } }}>
              {title}
            </Link>
          </h2>

          {post.publishedAt ? (
            <div className="vp-blog-card__legacy-meta">
              <BlogPostedOn publishedAt={post.publishedAt} locale={locale} />
            </div>
          ) : null}

          {excerpt ? (
            <div className="vp-blog-card__excerpt">
              <p>{excerpt}</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
