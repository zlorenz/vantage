'use client';

/**
 * BlogDesktopCategoryFilter — single-facet desktop filter for /news.
 *
 * Visual pattern mirrors PortfolioIndexDesktopFilterRow (text trigger +
 * accordion panel with live counts). Routing stays link-based
 * (/news, /category/[slug]) — not in-place filtering.
 */

import {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import type {Locale} from '@/i18n/routing';
import type {BlogPostCard as BlogPostCardData, CategoryTerm} from '@/types/sanity';
import './blog-desktop-category-filter.css';

interface BlogDesktopCategoryFilterProps {
  categories: CategoryTerm[];
  posts: BlogPostCardData[];
  locale: Locale;
  phrases?: Record<string, string>;
}

function ChevronGlyph() {
  return (
    <svg
      className="vp-blog-desktop-filter__chevron"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M6.22 9.97a.75.75 0 0 1 1.06 0L12 14.69l4.72-4.72a.75.75 0 1 1 1.06 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0l-5.25-5.25a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

function formatPanelCount(n: number): string {
  return `(${n})`;
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

export function BlogDesktopCategoryFilter({
  categories,
  posts,
  locale,
  phrases,
}: BlogDesktopCategoryFilterProps) {
  const t = useTranslations('Filters');
  const tBlog = useTranslations('Blog');
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="vp-blog-desktop-filter"
      data-blog-desktop-filter
    >
      <div className="vp-blog-desktop-filter__trigger-wrap">
        <button
          type="button"
          className={`vp-blog-desktop-filter__trigger${open ? ' is-open' : ''}`}
          aria-expanded={open}
          aria-controls="vp-blog-desktop-filter-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronGlyph />
          <span className="vp-blog-desktop-filter__trigger-label">
            {tBlog('categoriesFilter')}
          </span>
        </button>

        {open ? (
          <div
            id="vp-blog-desktop-filter-panel"
            className="vp-blog-desktop-filter__panel"
            role="listbox"
            aria-label={tBlog('categoriesFilter')}
          >
            <div className="vp-blog-desktop-filter__panel-body">
              <Link
                href="/news"
                className="vp-blog-desktop-filter__all is-selected"
                role="option"
                aria-selected
                onClick={() => setOpen(false)}
              >
                <span className="vp-blog-desktop-filter__all-label">
                  → {t('all')}
                </span>
                <span className="vp-blog-desktop-filter__term-count">
                  {formatPanelCount(allCount)}
                </span>
              </Link>

              <ul className="vp-blog-desktop-filter__terms">
                {options.map((opt) => (
                  <li key={opt.category._id}>
                    <Link
                      href={{
                        pathname: '/category/[slug]',
                        params: {slug: opt.slug},
                      }}
                      className="vp-blog-desktop-filter__term"
                      role="option"
                      aria-selected={false}
                      onClick={() => setOpen(false)}
                    >
                      <span className="vp-blog-desktop-filter__term-label">
                        {opt.label}
                      </span>
                      <span className="vp-blog-desktop-filter__term-count">
                        {formatPanelCount(opt.count)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="vp-blog-desktop-filter__watermark"
              src="/brand/vap-pattern.svg"
              alt=""
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
