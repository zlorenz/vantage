'use client';

/**
 * BlogCategoryFilter — category menu for /news and category archives.
 *
 * - Mobile (<576px): BottomSheet with a flat category list (single taxonomy —
 *   no root→Categories drill like /work's three taxonomies).
 * - Desktop (≥576px): BlogDesktopCategoryFilter (unchanged).
 *
 * Links navigate to /category/[slug]; "All" returns to /news.
 * SEARCH stays off on /news mobile.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {useTranslations} from 'next-intl';
import {BlogDesktopCategoryFilter} from '@/components/blog/BlogDesktopCategoryFilter';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Link} from '@/i18n/navigation';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import type {Locale} from '@/i18n/routing';
import type {BlogPostCard as BlogPostCardData, CategoryTerm} from '@/types/sanity';
import '@/components/portfolio/portfolio-index-filter-sheet.css';
import './blog-category-filter.css';
import './blog-index-filter-mobile.css';

const DESKTOP_MQ = '(min-width: 576px)';

function subscribeDesktop(onStoreChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function formatParenCount(n: number): string {
  return `( ${n} )`;
}

function categorySlug(term: CategoryTerm, locale: Locale): string {
  return locale === 'zh' ? term.slugZh || term.slug : term.slug;
}

function countPostsForCategory(
  posts: BlogPostCardData[],
  term: CategoryTerm,
): number {
  return posts.filter((post) =>
    post.categories?.some((c) => c._id === term._id || c.slug === term.slug),
  ).length;
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
  /** Active category slug on archive pages — marks term selected. */
  activeSlug?: string;
}

export function BlogCategoryFilter({
  categories,
  posts,
  locale,
  phrases,
  activeSlug,
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

  const options = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          count: countPostsForCategory(posts, category),
          label: pickLocaleFieldWithPhrases(
            locale,
            category.title,
            category.titleZh,
            phrases,
          ),
          slug: categorySlug(category, locale),
        }))
        .filter((opt) => opt.count > 0),
    [categories, posts, locale, phrases],
  );

  const allCount = posts.length;
  const allSelected = !activeSlug;

  const isTermSelected = (slug: string, category: CategoryTerm) => {
    if (!activeSlug) return false;
    return (
      activeSlug === slug ||
      activeSlug === category.slug ||
      activeSlug === category.slugZh
    );
  };

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
        className="vp-blog-index-filter-sheet"
        panelClassName="vp-blog-index-filter__panel"
        bodyClassName="vp-blog-index-filter__sheet-body"
      >
        <ul className="vp-blog-index-filter__list" role="listbox">
          <li>
            <Link
              href="/news"
              className={`vp-blog-index-filter__term${
                allSelected ? ' is-selected' : ''
              }`}
              role="option"
              aria-selected={allSelected}
              onClick={onClose}
            >
              <span className="vp-blog-index-filter__term-label">
                → {t('all')}
              </span>
              <span className="vp-blog-index-filter__term-count">
                {formatParenCount(allCount)}
              </span>
            </Link>
          </li>
          {options.map((opt) => {
            const selected = isTermSelected(opt.slug, opt.category);
            return (
              <li key={opt.category._id}>
                <Link
                  href={{
                    pathname: '/category/[slug]',
                    params: {slug: opt.slug},
                  }}
                  className={`vp-blog-index-filter__term${
                    selected ? ' is-selected' : ''
                  }`}
                  role="option"
                  aria-selected={selected}
                  onClick={onClose}
                >
                  <span className="vp-blog-index-filter__term-label">
                    {opt.label}
                  </span>
                  <span className="vp-blog-index-filter__term-count">
                    {formatParenCount(opt.count)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </div>
  );
}
