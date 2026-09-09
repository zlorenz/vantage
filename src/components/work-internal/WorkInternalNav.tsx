/**
 * WorkInternalNav — minimal fixed header for the internal work library.
 *
 * Brand mark → homepage. Centered library search. Page title on the right.
 */

'use client';

import {Link} from '@/i18n/navigation';

interface WorkInternalNavProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function WorkInternalNav({
  searchQuery,
  onSearchChange,
}: WorkInternalNavProps) {
  return (
    <header className="vp-internal-nav" aria-label="Work library">
      <div className="vp-internal-nav__inner">
        <Link
          className="vp-internal-nav__brand"
          href="/"
          rel="home noopener noreferrer"
          target="_blank"
        >
          {/* SVG via <img> — next/image does not optimize SVGs */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/vantage-logo.svg"
            alt="Vantage Pictures"
            width={36}
            height={36}
            className="vp-internal-nav__mark"
          />
        </Link>

        <label className="vp-internal-nav__search">
          <span className="sr-only">Search library</span>
          <input
            type="search"
            className="vp-internal-search__input"
            placeholder="Search title, client, crew…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>

        <h1 className="vp-internal-nav__title">Full Work Library</h1>
      </div>
    </header>
  );
}
