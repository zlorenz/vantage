'use client';

/**
 * BlogPostMasonry — round-robin columns so newest posts read left→right
 * across the top (unlike CSS column-count, which fills top→bottom per column).
 *
 * Column count matches prior breakpoints: 1 / 2 (md) / 3 (lg).
 */

import { useSyncExternalStore } from 'react';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import type { Locale } from '@/i18n/routing';
import type { BlogPostCard as BlogPostCardData } from '@/types/sanity';

const MQ_MD = '(min-width: 768px)';
const MQ_LG = '(min-width: 1024px)';

function getColumnCount(): number {
  if (window.matchMedia(MQ_LG).matches) return 3;
  if (window.matchMedia(MQ_MD).matches) return 2;
  return 1;
}

function subscribeColumnCount(onStoreChange: () => void) {
  const md = window.matchMedia(MQ_MD);
  const lg = window.matchMedia(MQ_LG);
  md.addEventListener('change', onStoreChange);
  lg.addEventListener('change', onStoreChange);
  return () => {
    md.removeEventListener('change', onStoreChange);
    lg.removeEventListener('change', onStoreChange);
  };
}

function distributeRoundRobin<T>(items: T[], columnCount: number): T[][] {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });
  return columns;
}

interface BlogPostMasonryProps {
  posts: BlogPostCardData[];
  locale: Locale;
  phrases?: Record<string, string>;
}

export function BlogPostMasonry({ posts, locale, phrases }: BlogPostMasonryProps) {
  // SSR + first paint: single chronological column (correct for crawlers / mobile).
  // After hydrate, redistribute for md/lg so the top row is newest → older LTR.
  const columnCount = useSyncExternalStore(
    subscribeColumnCount,
    getColumnCount,
    () => 1,
  );

  const columns = distributeRoundRobin(posts, columnCount);

  return (
    <div className="vp-news-masonry">
      {columns.map((columnPosts, columnIndex) => (
        <div key={columnIndex} className="vp-news-masonry__col">
          {columnPosts.map((post) => (
            <BlogPostCard
              key={post._id}
              post={post}
              locale={locale}
              phrases={phrases}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
