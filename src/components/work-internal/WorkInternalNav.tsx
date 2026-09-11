/**
 * WorkInternalNav — minimal fixed header for the internal work library.
 *
 * Brand mark → homepage. Centered library search with typeahead suggestions.
 * Page title on the right.
 */

'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
} from 'react';
import {Link} from '@/i18n/navigation';

interface WorkInternalNavProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Ranked suggestion phrases for the current (deferred) query. */
  suggestions?: string[];
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
  suggestions = [],
}: WorkInternalNavProps) {
  const {inputRef, onTouchEnd, onBlur: onIosBlur} = useIosFixedInputFocus();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const showList = open && suggestions.length > 0 && searchQuery.trim().length > 0;

  useEffect(() => {
    // Reset highlight when the suggestion set changes.
    setActiveIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    if (!showList) return;

    function onPointerDown(event: MouseEvent | TouchEvent | PointerEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);
      setActiveIndex(-1);
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showList]);

  const selectSuggestion = (phrase: string) => {
    onSearchChange(phrase);
    setOpen(false);
    setActiveIndex(-1);
    // Keep focus in the field so the user can refine immediately.
    inputRef.current?.focus({preventScroll: true});
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showList) {
      if (event.key === 'Escape') {
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      );
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const phrase = suggestions[activeIndex];
      if (phrase) selectSuggestion(phrase);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

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

        <div className="vp-internal-nav__search" ref={rootRef}>
          <label className="vp-internal-nav__search-label">
            <span className="sr-only">Search library</span>
            <input
              ref={inputRef}
              type="search"
              className="vp-internal-search__input"
              placeholder="Search brand, title, or key crew..."
              value={searchQuery}
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                showList && activeIndex >= 0
                  ? `${listId}-opt-${activeIndex}`
                  : undefined
              }
              onChange={(e) => {
                onSearchChange(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              onTouchEnd={onTouchEnd}
              onBlur={(e) => {
                onIosBlur();
                // Delay so option mousedown/click can commit first.
                const next = e.relatedTarget;
                if (next instanceof Node && rootRef.current?.contains(next)) {
                  return;
                }
                window.setTimeout(() => {
                  setOpen(false);
                  setActiveIndex(-1);
                }, 120);
              }}
              enterKeyHint="search"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </label>

          {showList ? (
            <ul
              id={listId}
              className="vp-internal-search__suggestions"
              role="listbox"
              aria-label="Search suggestions"
            >
              {suggestions.map((phrase, index) => {
                const active = index === activeIndex;
                return (
                  <li key={phrase} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-opt-${index}`}
                      role="option"
                      aria-selected={active}
                      className={
                        active
                          ? 'vp-internal-search__suggestion is-active'
                          : 'vp-internal-search__suggestion'
                      }
                      // preventDefault keeps input focus; select on pointer down
                      // so blur-delay races don't swallow the click on iOS.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(phrase)}
                    >
                      {phrase}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <h1 className="vp-internal-nav__title">Full Work Library</h1>
      </div>
    </header>
  );
}
