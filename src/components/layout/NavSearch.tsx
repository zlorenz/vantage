'use client';

/**
 * NavSearch — expandable inline search in the desktop navbar.
 *
 * Hidden on mobile (≤768px) per live site. On submit, navigates to the
 * locale-aware search results page with the query string.
 */

import { FormEvent, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { searchPath } from '@/lib/nav-paths';
import type { Locale } from '@/i18n/routing';

interface NavSearchProps {
  locale: Locale;
}

export function NavSearch({ locale }: NavSearchProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`${searchPath(locale)}?q=${encodeURIComponent(q)}`);
    setExpanded(false);
    setQuery('');
  }

  return (
    <form
      className="vp-search-form ml-4 hidden md:block"
      role="search"
      onSubmit={handleSubmit}
    >
      <div className="vp-search-wrapper relative">
        {expanded ? (
          <input
            type="search"
            name="q"
            className="vp-search-input w-48 min-h-[2.625rem] border border-vp-input-border bg-vp-input-bg px-[0.9rem] py-2 pr-10 text-sm text-white transition-[background,border-color] duration-vp-default focus:border-vp-input-border-focus focus:bg-vp-input-bg-focus focus:outline-none"
            placeholder="Search"
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            onBlur={() => {
              if (!query.trim()) setExpanded(false);
            }}
          />
        ) : null}
        <button
          type={expanded ? 'submit' : 'button'}
          className="vp-search-button absolute right-[0.7rem] top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-white/80 transition-colors duration-vp-default hover:text-white focus:text-white"
          aria-label={expanded ? 'Submit search' : 'Open search'}
          onClick={() => {
            if (!expanded) setExpanded(true);
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
