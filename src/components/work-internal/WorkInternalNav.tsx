/**
 * WorkInternalNav — minimal fixed header for the internal work library.
 *
 * Brand mark → homepage. Centered library search. Page title on the right.
 */

'use client';

import {useEffect, useRef, type TouchEvent} from 'react';
import {Link} from '@/i18n/navigation';

interface WorkInternalNavProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

/**
 * iOS Safari/Chrome scroll the document when focusing an input inside a
 * `position: fixed` header (to keep it above the keyboard), then settle —
 * which reads as a brief page jump. Intercept the touch, focus with
 * `preventScroll`, and briefly pin scrollY in case iOS still nudges.
 */
function useIosFixedInputFocus() {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollYRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const pinScroll = () => {
    const y = scrollYRef.current;
    if (window.scrollY !== y) window.scrollTo(0, y);
  };

  const onTouchEnd = (event: TouchEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;
    // Already focused — let the caret move / selection work normally.
    if (document.activeElement === input) return;

    // Stop iOS's default focus→scroll-into-view path.
    event.preventDefault();
    scrollYRef.current = window.scrollY;
    input.focus({preventScroll: true});

    clearTimers();
    pinScroll();
    requestAnimationFrame(pinScroll);
    // Keyboard open animation is ~250–350ms; catch late scroll nudges.
    for (const ms of [50, 100, 200, 350]) {
      timersRef.current.push(window.setTimeout(pinScroll, ms));
    }
  };

  const onBlur = () => {
    clearTimers();
  };

  return {inputRef, onTouchEnd, onBlur};
}

export function WorkInternalNav({
  searchQuery,
  onSearchChange,
}: WorkInternalNavProps) {
  const {inputRef, onTouchEnd, onBlur} = useIosFixedInputFocus();

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
            ref={inputRef}
            type="search"
            className="vp-internal-search__input"
            placeholder="Search title, client, crew…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onTouchEnd={onTouchEnd}
            onBlur={onBlur}
            enterKeyHint="search"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </label>

        <h1 className="vp-internal-nav__title">Full Work Library</h1>
      </div>
    </header>
  );
}
