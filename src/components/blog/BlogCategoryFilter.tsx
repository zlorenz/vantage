'use client';

/**
 * BlogCategoryFilter — hidden category menu for /news (Production Log).
 *
 * Same interaction model as the /work portfolio filter:
 * - Mobile (<576px): BottomSheet wipe-up
 * - Desktop (≥576px): anchored popout (opens downward from the header trigger)
 *
 * Single flat list of categories (no nested drill-in). Links navigate to
 * /category/[slug]; "All" returns to /news.
 */

import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {useTranslations} from 'next-intl';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {Link} from '@/i18n/navigation';
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field';
import type {Locale} from '@/i18n/routing';
import type {CategoryTerm} from '@/types/sanity';
import '@/components/portfolio/portfolio-index-filter-sheet.css';
import './blog-category-filter.css';

const DESKTOP_MQ = '(min-width: 576px)';
const DESKTOP_CLOSE_MS = 180;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6.4 6.4a.75.75 0 0 1 1.06 0L12 10.94l4.54-4.54a.75.75 0 1 1 1.06 1.06L13.06 12l4.54 4.54a.75.75 0 1 1-1.06 1.06L12 13.06l-4.54 4.54a.75.75 0 0 1-1.06-1.06L10.94 12 6.4 7.46a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

interface BlogCategoryFilterProps {
  categories: CategoryTerm[];
  locale: Locale;
  phrases?: Record<string, string>;
}

export function BlogCategoryFilter({
  categories,
  locale,
  phrases,
}: BlogCategoryFilterProps) {
  const t = useTranslations('Filters');
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_MQ).matches,
    () => false,
  );

  const onClose = () => setOpen(false);

  // Desktop mount / fade lifecycle (mirrors PortfolioIndexFilterSheet).
  useEffect(() => {
    if (!isDesktop) {
      setMounted(false);
      setVisible(false);
      return;
    }

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    if (!mounted) return;

    setVisible(false);
    const finish = () => {
      setMounted(false);
      closeTimerRef.current = null;
    };

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    closeTimerRef.current = setTimeout(finish, DESKTOP_CLOSE_MS);
  }, [open, isDesktop, mounted]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || !isDesktop) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
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

      {isDesktop ? (
        mounted ? (
          <div
            className={`vp-index-filter-sheet vp-news-page__filter-sheet${
              visible ? ' is-open' : ''
            }`}
            role="presentation"
          >
            <div
              className="vp-index-filter-sheet__panel"
              role="dialog"
              aria-modal={false}
              aria-label={t('filter')}
              aria-hidden={!visible}
            >
              <div className="vp-index-filter-sheet__header">
                <div className="vp-index-filter-sheet__header-start">
                  <span
                    className="vp-index-filter-sheet__header-spacer"
                    aria-hidden
                  />
                </div>
                <h2 className="vp-index-filter-sheet__title">{t('filter')}</h2>
                <div className="vp-index-filter-sheet__header-end">
                  <button
                    type="button"
                    className="vp-index-filter-sheet__icon-btn"
                    aria-label={t('closeFilterAria')}
                    onClick={onClose}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
              <div className="vp-index-filter-sheet__body">{categoryList}</div>
            </div>
          </div>
        ) : null
      ) : (
        <BottomSheet
          open={open}
          onClose={onClose}
          title={t('filter')}
          closeAriaLabel={t('closeFilterAria')}
        >
          {categoryList}
        </BottomSheet>
      )}
    </div>
  );
}
