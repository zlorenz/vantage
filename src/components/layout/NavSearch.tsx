'use client';

/**
 * NavSearch — expandable inline search in the navbar.
 *
 * Default: icon click reveals an input. Pass `alwaysExpanded` to render the
 * input immediately (used inside the hamburger nav panels).
 */

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export function NavSearch({ alwaysExpanded = false }: { alwaysExpanded?: boolean }) {
  const t = useTranslations('Search');
  const router = useRouter();
  const [expanded, setExpanded] = useState(alwaysExpanded);
  const [query, setQuery] = useState('');

  const showInput = alwaysExpanded || expanded;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(
      {
        pathname: '/search',
        query: { q },
      } as Parameters<typeof router.push>[0],
    );
    if (!alwaysExpanded) setExpanded(false);
    setQuery('');
  }

  return (
    <form
      className={
        alwaysExpanded
          ? 'vp-search-form vp-nav-panel-search w-full'
          : 'vp-search-form ml-2 hidden md:block'
      }
      role="search"
      onSubmit={handleSubmit}
    >
      <div className="vp-search-wrapper relative flex items-center">
        {showInput ? (
          <input
            type="search"
            name="q"
            className={
              alwaysExpanded
                ? 'vp-search-input w-full min-h-[2.625rem] border border-vp-input-border bg-vp-input-bg px-[0.9rem] py-2 pr-10 text-sm text-white transition-[background,border-color] duration-vp-default focus:border-vp-input-border-focus focus:bg-vp-input-bg-focus focus:outline-none'
                : 'vp-search-input w-48 min-h-[2.625rem] border border-vp-input-border bg-vp-input-bg px-[0.9rem] py-2 pr-10 text-sm text-white transition-[background,border-color] duration-vp-default focus:border-vp-input-border-focus focus:bg-vp-input-bg-focus focus:outline-none'
            }
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus={!alwaysExpanded}
            onBlur={() => {
              if (alwaysExpanded) return;
              if (!query.trim()) setExpanded(false);
            }}
          />
        ) : null}
        <button
          type={showInput ? 'submit' : 'button'}
          className={
            showInput
              ? 'vp-search-button absolute right-[0.7rem] top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0 text-white/80 transition-colors duration-vp-default hover:text-white focus:text-white'
              : 'vp-search-button inline-flex cursor-pointer items-center border-0 bg-transparent p-2 text-white/80 transition-colors duration-vp-default hover:text-white focus:text-white'
          }
          aria-label={showInput ? t('submitAria') : t('openAria')}
          onClick={() => {
            if (!showInput) setExpanded(true);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
        </button>
      </div>
    </form>
  );
}
