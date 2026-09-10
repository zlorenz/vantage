/**
 * FeaturedPost — full-width featured blog block on /news.
 * Figma Blog 2050:5488: 770px text / image split, 680px tall, READ MORE CTA.
 */

import Image from 'next/image';
import {getTranslations} from 'next-intl/server';
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
}

/** Local short-month pill date — shared BlogPostedOn unchanged. */
function formatFeaturedPillDate(dateString: string, locale: Locale): string {
  return new Date(dateString).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function FeaturedPost({post, locale, phrases}: FeaturedPostProps) {
  const t = await getTranslations('Blog');
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
    <article className="vp-featured-post">
      <div className="vp-featured-post__inner">
        <div className="vp-featured-post__content">
          <div className="vp-featured-post__copy">
            {post.publishedAt || categories.length ? (
              <div className="vp-featured-post__pills">
                {post.publishedAt ? (
                  <time className="vp-featured-post__pill" dateTime={post.publishedAt}>
                    {formatFeaturedPillDate(post.publishedAt, locale)}
                  </time>
                ) : null}
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
            {t('readMore')}
          </Link>
        </div>

        <div className="vp-featured-post__media">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={1200}
              height={680}
              className="vp-featured-post__image"
              sizes="(max-width: 1023px) 100vw, 60vw"
              priority
            />
          ) : (
            <div className="vp-featured-post__image-fallback" aria-hidden="true" />
          )}
        </div>

        <div className="vp-featured-post__brackets" aria-hidden="true">
          <span className="vp-featured-post__bracket vp-featured-post__bracket--tl" />
          <span className="vp-featured-post__bracket vp-featured-post__bracket--tr" />
          <span className="vp-featured-post__bracket vp-featured-post__bracket--br" />
          <span className="vp-featured-post__bracket vp-featured-post__bracket--bl" />
        </div>
      </div>
    </article>
  );
}
