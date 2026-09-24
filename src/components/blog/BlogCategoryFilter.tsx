'use client';

/**
 * BlogCategoryFilter — category menu for /news and category archives.
 *
 * - Mobile (<576px): BottomSheet with root→nested Categories drill
 *   (blog-scoped skin — does not touch .vp-work-index-filter*).
 * - Desktop (≥576px): BlogDesktopCategoryFilter (unchanged).
 *
 * Links navigate to /category/[slug]; "All" returns to /news.
 * SEARCH stays off on /news mobile.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
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
const DRILL_MS = 240;

type SheetView = 'root' | 'categories';
type DrillDirection = 'forward' | 'back';

interface DrillTransition {
  from: SheetView;
  to: SheetView;
  direction: DrillDirection;
}

function subscribeDesktop(onStoreChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M14.78 5.47a.75.75 0 0 1 0 1.06L9.31 12l5.47 5.47a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}

interface BlogCategoryFilterProps {
  categories: CategoryTerm[];
  posts: BlogPostCardData[];
  locale: Locale;
  phrases?: Record<string, string>;
  /** Active category slug on archive pages — marks nested term selected. */
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
  const tBlog = useTranslations('Blog');
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState<SheetView>('root');
  const [drill, setDrill] = useState<DrillTransition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drillRunIdRef = useRef(0);

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

  const selectedSummary = useMemo(() => {
    if (!activeSlug) return t('all');
    const match = options.find(
      (opt) =>
        opt.slug === activeSlug ||
        opt.category.slug === activeSlug ||
        opt.category.slugZh === activeSlug,
    );
    return match?.label ?? t('all');
  }, [activeSlug, options, t]);

  const chromeView = drill?.to ?? activeView;

  const resetFilterView = useCallback(() => {
    if (drillTimerRef.current) {
      clearTimeout(drillTimerRef.current);
      drillTimerRef.current = null;
    }
    setDrill(null);
    setActiveView('root');
    drillRunIdRef.current += 1;
  }, []);

  const goToView = (next: SheetView) => {
    if (drill) return;
    if (next === activeView) return;

    if (prefersReducedMotion()) {
      setActiveView(next);
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const direction: DrillDirection = next === 'root' ? 'back' : 'forward';
    setDrill({from: activeView, to: next, direction});
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

  useEffect(() => {
    return () => {
      if (drillTimerRef.current) clearTimeout(drillTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!drill) return;

    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const runId = ++drillRunIdRef.current;
    const width = viewport.offsetWidth;
    const startX = drill.direction === 'back' ? -width : 0;
    const endX = drill.direction === 'back' ? 0 : -width;

    track.style.transition = 'none';
    track.style.transform = `translate3d(${startX}px,0,0)`;
    void track.offsetWidth;

    const raf = requestAnimationFrame(() => {
      if (drillRunIdRef.current !== runId) return;
      track.style.transition = `transform ${DRILL_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      track.style.transform = `translate3d(${endX}px,0,0)`;
    });

    if (drillTimerRef.current) clearTimeout(drillTimerRef.current);
    const toView = drill.to;
    drillTimerRef.current = setTimeout(() => {
      if (drillRunIdRef.current !== runId) return;
      setActiveView(toView);
      setDrill(null);
      track.style.transition = '';
      track.style.transform = '';
      drillTimerRef.current = null;
    }, DRILL_MS);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [drill]);

  const title =
    chromeView === 'root' ? t('filter') : tBlog('categoriesFilter');

  const isTermSelected = (slug: string, category: CategoryTerm) => {
    if (!activeSlug) return false;
    return (
      activeSlug === slug ||
      activeSlug === category.slug ||
      activeSlug === category.slugZh
    );
  };

  const allSelected = !activeSlug;

  const renderMobileView = (view: SheetView): ReactNode => {
    if (view === 'root') {
      return (
        <ul className="vp-blog-index-filter__list">
          <li>
            <button
              type="button"
              className="vp-blog-index-filter__row"
              onClick={() => goToView('categories')}
            >
              <span className="vp-blog-index-filter__row-label">
                {tBlog('categoriesFilter')}
              </span>
              <span className="vp-blog-index-filter__row-value">
                {selectedSummary}
              </span>
            </button>
          </li>
        </ul>
      );
    }

    return (
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
    );
  };

  const headerStart =
    chromeView === 'root' ? (
      <span className="vp-bottom-sheet__header-spacer" aria-hidden />
    ) : (
      <button
        type="button"
        className="vp-bottom-sheet__icon-btn vp-index-filter-sheet__icon-btn"
        aria-label={t('backToFiltersAria')}
        onClick={() => goToView('root')}
        disabled={Boolean(drill)}
      >
        <BackIcon />
      </button>
    );

  const buildDrillBody = (render: (view: SheetView) => ReactNode) => (
    <div
      className={`vp-index-filter-sheet__viewport-wrap${
        drill ? ' is-drilling' : ''
      }`}
    >
      <div ref={viewportRef} className="vp-index-filter-sheet__viewport">
        <div
          ref={trackRef}
          className={`vp-index-filter-sheet__track${
            drill ? ' is-sliding' : ''
          }`}
        >
          {drill ? (
            drill.direction === 'forward' ? (
              <>
                <div className="vp-index-filter-sheet__pane" aria-hidden>
                  {render(drill.from)}
                </div>
                <div className="vp-index-filter-sheet__pane vp-index-filter-sheet__pane--incoming">
                  {render(drill.to)}
                </div>
              </>
            ) : (
              <>
                <div className="vp-index-filter-sheet__pane vp-index-filter-sheet__pane--incoming">
                  {render(drill.to)}
                </div>
                <div className="vp-index-filter-sheet__pane" aria-hidden>
                  {render(drill.from)}
                </div>
              </>
            )
          ) : (
            <div className="vp-index-filter-sheet__pane">
              {render(activeView)}
            </div>
          )}
        </div>
      </div>
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
        title={title}
        closeAriaLabel={t('closeFilterAria')}
        headerStart={headerStart}
        className="vp-blog-index-filter-sheet"
        panelClassName="vp-blog-index-filter__panel"
        bodyClassName={`vp-blog-index-filter__sheet-body${
          drill ? ' is-drilling' : ''
        }`}
        onClosed={resetFilterView}
      >
        {buildDrillBody(renderMobileView)}
      </BottomSheet>
    </div>
  );
}
