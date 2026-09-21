/**
 * FeaturedPost — full-width featured blog block on /news (and BlogPostNav slides).
 * Figma Blog 2050:5488: 770px text / image split, 680px tall, READ MORE CTA.
 */

import Image from 'next/image';
import {Link} from '@/i18n/navigation';
import {resolveBlogCardExcerpt} from '@/lib/blog-excerpt';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import {urlForImage} from '@/lib/sanity';
import type {Locale} from '@/i18n/routing';
import type {BlogPostCard as BlogPostCardData} from '@/types/sanity';
import './featured-post.css';

interface FeaturedPostProps {
  post: BlogPostCardData;
  locale: Locale;
  phrases?: Record<string, string>;
  /** Translated CTA label — passed from the parent so this stays sync/client-safe. */
  readMore: string;
  /** Only the news-index featured instance should eager-load. */
  priority?: boolean;
  className?: string;
}

/** Local short-month pill date — shared BlogPostedOn unchanged. */
function formatFeaturedPillDate(dateString: string, locale: Locale): string {
  return new Date(dateString).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function FeaturedPost({
  post,
  locale,
  phrases,
  readMore,
  priority = false,
  className = '',
}: FeaturedPostProps) {
  const slugParam = locale === 'zh' ? post.slugZh || post.slug : post.slug;
  const title = pickLocaleFieldWithPhrases(locale, post.title, post.titleZh, phrases);
  const excerpt = resolveBlogCardExcerpt(
    pickLocaleFieldWithPhrases(locale, post.excerpt, post.excerptZh, phrases),
    pickLocaleFieldWithPhrases(locale, post.bodyText, post.bodyTextZh, phrases),
  );
  const imageUrl = post.featuredImage
    ? urlForImage(post.featuredImage).width(1200).height(680).fit('crop').url()
    : null;
  const categories = post.categories ?? [];
  const href = {pathname: '/[slug]' as const, params: {slug: slugParam}};

  return (
    <article className={`vp-featured-post ${className}`.trim()}>
      <div className="vp-featured-post__brackets" aria-hidden="true">
        <span className="vp-featured-post__bracket vp-featured-post__bracket--tl" />
        <span className="vp-featured-post__bracket vp-featured-post__bracket--tr" />
        <span className="vp-featured-post__bracket vp-featured-post__bracket--br" />
        <span className="vp-featured-post__bracket vp-featured-post__bracket--bl" />
      </div>

      <div className="vp-featured-post__inner">
        <div className="vp-featured-post__content">
          <div className="vp-featured-post__copy">
            {categories.length ? (
              <div className="vp-featured-post__pills">
                {categories.map((category) => {
                  const catSlug =
                    locale === 'zh'
                      ? category.slugZh || category.slug
                      : category.slug;
                  const catLabel = pickLocaleFieldWithPhrases(
                    locale,
                    category.title,
                    category.titleZh,
                    phrases,
                  );
                  return (
                    <Link
                      key={category._id}
                      href={{
                        pathname: '/category/[slug]',
                        params: {slug: catSlug},
                      }}
                      className="vp-featured-post__pill"
                    >
                      {catLabel}
                    </Link>
                  );
                })}
              </div>
            ) : null}

            <div className="vp-featured-post__text">
              <h2 className="vp-featured-post__title">
                <Link href={href}>{title}</Link>
              </h2>
              {excerpt ? (
                <p className="vp-featured-post__excerpt">{excerpt}</p>
              ) : null}
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="vp-featured-post__motif"
            src="/brand/vap-pattern.svg"
            alt=""
            aria-hidden="true"
          />

          <Link href={href} className="vp-featured-post__cta">
            <span className="vp-featured-post__cta-label">{readMore}</span>
            <svg
              className="vp-featured-post__cta-arrow"
              viewBox="0 0 18 18"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="currentColor"
                d="M4.2 12.9 11.4 5.7H6.75V4.2H14.1v7.35h-1.5V6.9L5.4 14.1z"
              />
            </svg>
          </Link>
        </div>

        <div className="vp-featured-post__media">
          {post.publishedAt ? (
            <time className="vp-featured-post__date-pill" dateTime={post.publishedAt}>
              {formatFeaturedPillDate(post.publishedAt, locale)}
            </time>
          ) : null}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={1200}
              height={680}
              className="vp-featured-post__image"
              sizes="(max-width: 1023px) 100vw, 60vw"
              priority={priority}
            />
          ) : (
            <div className="vp-featured-post__image-fallback" aria-hidden="true" />
          )}
        </div>
      </div>
    </article>
  );
}
