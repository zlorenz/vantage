'use client';

/**
 * NavSearch — expandable inline search in the navbar.
 *
 * Default: icon click reveals an input. Pass `alwaysExpanded` to render the
 * input immediately (used inside the hamburger nav panels).
 */

import { FormEvent, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { trackInteractionEvent } from '@/lib/interaction-events';

export function NavSearch({
  alwaysExpanded = false,
  onSubmitSuccess,
}: {
  alwaysExpanded?: boolean;
  /** Called after a successful submit (e.g. close the mobile nav panel). */
  onSubmitSuccess?: () => void;
}) {
  const t = useTranslations('Search');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(alwaysExpanded);
  const [query, setQuery] = useState('');

  const showInput = alwaysExpanded || expanded;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    trackInteractionEvent({
      eventType: 'search_submit',
      sourceSurface: 'nav_search',
      query: q,
    });
    // Blur first so iOS dismisses the keyboard before the panel closes.
    inputRef.current?.blur();
    onSubmitSuccess?.();
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
          : 'vp-search-form hidden md:block'
      }
      role="search"
      onSubmit={handleSubmit}
    >
      <div className="vp-search-wrapper relative flex items-center">
        {showInput ? (
          <input
            ref={inputRef}
            type="search"
            name="q"
            /* Look owned by #header .vp-search-form rules in globals.css. */
            className="vp-search-input"
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
          className="vp-search-button cursor-pointer border-0 bg-transparent p-0"
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
