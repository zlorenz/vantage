/**
 * Per-item overflow menu for work-internal cards/rows.
 *
 * Visibility matches the bulk-select checkbox: always on touch, hover on
 * fine pointers. Menu actions are siblings of the hit target so they never
 * navigate to project details accidentally.
 */

'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import type {InternalLibraryEntry} from '@/types/sanity';
import {
  openPortfolioEntry,
  prepareWorkInternalDetailNavigation,
} from './entry-url';

interface WorkInternalItemMenuProps {
  entry: InternalLibraryEntry;
  locale: Locale;
}

export function WorkInternalItemMenu({
  entry,
  locale,
}: WorkInternalItemMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const router = useRouter();

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
      className={open ? 'vp-internal-menu is-open' : 'vp-internal-menu'}
    >
      <button
        type="button"
        className="vp-internal-menu__btn"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Item actions"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        ···
      </button>
      {open ? (
        <div
          id={menuId}
          className="vp-internal-menu__panel"
          role="menu"
          aria-label="Item actions"
        >
          <button
            type="button"
            role="menuitem"
            className="vp-internal-menu__item"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              const href = prepareWorkInternalDetailNavigation(entry);
              router.push(href);
            }}
          >
            Project details
          </button>
          <button
            type="button"
            role="menuitem"
            className="vp-internal-menu__item"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              openPortfolioEntry(entry, locale);
            }}
          >
            Open public page
          </button>
        </div>
      ) : null}
    </div>
  );
}
