/**
 * Nav switcher between Full Work Library and Showreels indexes.
 * Desktop: title + caret. Mobile: hamburger to the right of search / nav.
 */

'use client';

import {useEffect, useId, useRef, useState} from 'react';
import Link from 'next/link';
import {workInternalLibraryBrowserPath} from '@/lib/internal-app-paths';
import {showreelIndexPath} from '@/lib/showreel-urls';

export type WorkInternalNavSection = 'library' | 'showreels';

const SECTIONS: Array<{
  id: WorkInternalNavSection;
  label: string;
  href: () => string;
}> = [
  {
    id: 'library',
    label: 'Full Work Library',
    href: () => workInternalLibraryBrowserPath(),
  },
  {
    id: 'showreels',
    label: 'Showreels',
    href: () => showreelIndexPath(),
  },
];

interface WorkInternalNavIndexMenuProps {
  current: WorkInternalNavSection;
  /** Use an h1 for the library index (document title in the nav). */
  asHeading?: boolean;
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M4 7.25h16a.75.75 0 0 0 0-1.5H4a.75.75 0 0 0 0 1.5Zm0 5.5h16a.75.75 0 0 0 0-1.5H4a.75.75 0 0 0 0 1.5Zm0 5.5h16a.75.75 0 0 0 0-1.5H4a.75.75 0 0 0 0 1.5Z"
      />
    </svg>
  );
}

export function WorkInternalNavIndexMenu({
  current,
  asHeading = false,
}: WorkInternalNavIndexMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const currentItem = SECTIONS.find((section) => section.id === current)!;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

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
      className={
        open ? 'vp-internal-nav-index is-open' : 'vp-internal-nav-index'
      }
    >
      {asHeading ? (
        <h1 className="sr-only">{currentItem.label}</h1>
      ) : null}

      {/* Desktop: title + caret */}
      <div className="vp-internal-nav__title">
        <button
          type="button"
          className="vp-internal-nav-index__btn"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="vp-internal-nav-index__label">
            {currentItem.label}
          </span>
          <svg
            className="vp-internal-nav-index__caret"
            viewBox="0 0 12 12"
            width="12"
            height="12"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M2.4 4.2 L6 8 L9.6 4.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Mobile: hamburger */}
      <button
        type="button"
        className="vp-internal-nav-index__menu-btn"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MenuIcon />
      </button>

      {open ? (
        <div
          id={menuId}
          className="vp-internal-nav-index__panel"
          role="menu"
          aria-label="Switch index"
        >
          {SECTIONS.map((section) => {
            const isCurrent = section.id === current;
            return (
              <Link
                key={section.id}
                href={section.href()}
                role="menuitem"
                aria-current={isCurrent ? 'page' : undefined}
                className={
                  isCurrent
                    ? 'vp-internal-nav-index__item is-current'
                    : 'vp-internal-nav-index__item'
                }
                onClick={() => setOpen(false)}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
