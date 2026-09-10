/**
 * BlogPostGrid — fixed 2-column post grid for /news and category archives.
 *
 * Retires BlogPostMasonry’s client round-robin (1/2/3 columns). Figma Blog
 * frame 2051:6108 is equal ~960px columns on 1920; CSS grid places posts in
 * row order (same LTR top-row reading as 2-col round-robin) without JS.
 */

import { BlogPostCard } from '@/components/blog/BlogPostCard';
import type { Locale } from '@/i18n/routing';
import type { BlogPostCard as BlogPostCardData } from '@/types/sanity';
import './blog-post-grid.css';

interface BlogPostGridProps {
  posts: BlogPostCardData[];
  locale: Locale;
  phrases?: Record<string, string>;
  /** Optional post to omit (featured block wiring in Phase 4). */
  excludePostId?: string | null;
}

export function BlogPostGrid({
  posts,
  locale,
  phrases,
  excludePostId,
}: BlogPostGridProps) {
  const visiblePosts = excludePostId
    ? posts.filter((post) => post._id !== excludePostId)
    : posts;

  if (!visiblePosts.length) return null;

  return (
    <div className="vp-blog-grid">
      {visiblePosts.map((post) => (
        <BlogPostCard
          key={post._id}
          post={post}
          locale={locale}
          phrases={phrases}
        />
      ))}
    </div>
  );
}
