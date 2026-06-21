/**
 * BlogPostCard — news index and category archive list card.
 */

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { urlForImage } from '@/lib/sanity';
import type { BlogPostCard as BlogPostCardData } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

interface BlogPostCardProps {
  post: BlogPostCardData;
  locale: Locale;
}

function formatDate(dateString: string, locale: Locale): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogPostCard({ post, locale }: BlogPostCardProps) {
  const slugParam = locale === 'zh' ? post.slugZh || post.slug : post.slug;
  const title = locale === 'zh' && post.titleZh ? post.titleZh : post.title;

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

      <div className="vp-post-card__body">
        <h2 className="vp-post-card__title m-0 mb-1 text-[clamp(1.4rem,2vw,2.25rem)] font-bold uppercase leading-tight">
          <Link
            href={{ pathname: '/[slug]', params: { slug: slugParam } }}
            className="text-inherit no-underline hover:opacity-80"
          >
            {title}
          </Link>
        </h2>

        {post.publishedAt ? (
          <div className="vp-post-card__meta mb-2 text-sm uppercase tracking-wide text-white/65">
            {formatDate(post.publishedAt, locale)}
          </div>
        ) : null}

        {post.excerpt ? (
          <div className="vp-post-card__excerpt font-light text-vp-text-muted">
            <p className="m-0 line-clamp-3">{post.excerpt}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
