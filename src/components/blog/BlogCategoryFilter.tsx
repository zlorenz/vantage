'use client';

/**
 * BlogCategoryFilter — category menu for /news (Production Log).
 *
 * - Mobile (<576px): BottomSheet wipe-up (unchanged)
 * - Desktop (≥576px): BlogDesktopCategoryFilter (portfolio-style trigger + panel)
 *
 * Links navigate to /category/[slug]; "All" returns to /news.
 */

import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {useTranslations} from 'next-intl';
import {BlogDesktopCategoryFilter} from '@/components/blog/BlogDesktopCategoryFilter';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Link} from '@/i18n/navigation';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import type {Locale} from '@/i18n/routing';
import type {BlogPostCard as BlogPostCardData, CategoryTerm} from '@/types/sanity';
import '@/components/portfolio/portfolio-index-filter-sheet.css';
import './blog-category-filter.css';

const DESKTOP_MQ = '(min-width: 576px)';

function subscribeDesktop(onStoreChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function FunnelIcon() {
  return (
    <svg
      className="vp-news-page__filter-trigger-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M3.5 5.25A.75.75 0 0 1 4.25 4.5h15.5a.75.75 0 0 1 .53 1.28l-5.78 5.78v5.69a.75.75 0 0 1-1.13.65l-3.5-2a.75.75 0 0 1-.37-.65v-3.69L3.72 5.78A.75.75 0 0 1 3.5 5.25Z"
      />
    </svg>
  );
}

interface BlogCategoryFilterProps {
  categories: CategoryTerm[];
  posts: BlogPostCardData[];
  locale: Locale;
  phrases?: Record<string, string>;
}

export function BlogCategoryFilter({
  categories,
  posts,
  locale,
  phrases,
}: BlogCategoryFilterProps) {
  const t = useTranslations('Filters');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_MQ).matches,
    () => false,
  );

  const onClose = () => setOpen(false);

  useEffect(() => {
    if (!open || isDesktop) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, isDesktop]);

  const categoryList = (
    <div className="vp-index-filter-sheet__pane">
      <ul className="vp-index-filter-sheet__list">
        <li>
          <Link
            href="/news"
            className="vp-index-filter-sheet__term is-selected"
            onClick={onClose}
          >
            {t('all')}
          </Link>
        </li>
        {categories.map((category) => {
          const slugParam =
            locale === 'zh' ? category.slugZh || category.slug : category.slug;
          const label = pickLocaleFieldWithPhrases(
            locale,
            category.title,
            category.titleZh,
            phrases,
          );

          return (
            <li key={category._id}>
              <Link
                href={{
                  pathname: '/category/[slug]',
                  params: {slug: slugParam},
                }}
                className="vp-index-filter-sheet__term"
                onClick={onClose}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (isDesktop) {
    return (
      <BlogDesktopCategoryFilter
        categories={categories}
        posts={posts}
        locale={locale}
        phrases={phrases}
      />
    );
  }

  return (
    <div className="vp-news-page__filter-anchor" ref={rootRef}>
      <button
        type="button"
        className="vp-news-page__filter-trigger"
        aria-label={t('filter')}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <FunnelIcon />
      </button>

      <BottomSheet
        open={open}
        onClose={onClose}
        title={t('filter')}
        closeAriaLabel={t('closeFilterAria')}
      >
        {categoryList}
      </BottomSheet>
    </div>
  );
}
