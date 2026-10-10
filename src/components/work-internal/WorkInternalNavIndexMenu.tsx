/**
 * Nav title switcher between Full Work Library and Showreels indexes.
 * Keeps the existing `.vp-internal-nav__title` look; adds a caret + menu.
 */

'use client'

import {useEffect, useId, useRef, useState} from 'react'
import Link from 'next/link'
import {workInternalLibraryBrowserPath} from '@/lib/internal-app-paths'
import {showreelIndexPath} from '@/lib/showreel-urls'

export type WorkInternalNavSection = 'library' | 'showreels'

const SECTIONS: Record<
  WorkInternalNavSection,
  {label: string; href: () => string}
> = {
  library: {
    label: 'Full Work Library',
    href: () => workInternalLibraryBrowserPath(),
  },
  showreels: {
    label: 'Showreels',
    href: () => showreelIndexPath(),
  },
}

interface WorkInternalNavIndexMenuProps {
  current: WorkInternalNavSection
  /** Use an h1 for the library index (document title in the nav). */
  asHeading?: boolean
}

export function WorkInternalNavIndexMenu({
  current,
  asHeading = false,
}: WorkInternalNavIndexMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const other: WorkInternalNavSection =
    current === 'library' ? 'showreels' : 'library'
  const currentItem = SECTIONS[current]
  const otherItem = SECTIONS[other]
  const TitleTag = asHeading ? 'h1' : 'div'

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current
      if (!root || root.contains(event.target as Node)) return
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={
        open ? 'vp-internal-nav-index is-open' : 'vp-internal-nav-index'
      }
    >
      <TitleTag className="vp-internal-nav__title">
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
      </TitleTag>
      {open ? (
        <div
          id={menuId}
          className="vp-internal-nav-index__panel"
          role="menu"
          aria-label="Switch index"
        >
          <Link
            href={otherItem.href()}
            role="menuitem"
            className="vp-internal-nav-index__item"
            onClick={() => setOpen(false)}
          >
            {otherItem.label}
          </Link>
        </div>
      ) : null}
    </div>
  )
}
