/**
 * WorkInternalUtilityChrome — minimal fixed nav + optional back toolbar for
 * internal utility pages (showreel editor/login, etc.).
 *
 * Brand mark opens the marketing homepage in a new tab (same as library nav).
 */

'use client'

import type {ReactNode} from 'react'
import {Link, useRouter} from '@/i18n/navigation'
import {libraryReturnBrowserPath} from '@/lib/internal-app-paths'

interface WorkInternalUtilityChromeProps {
  /** Right-side label in the fixed nav (e.g. "Showreel editor"). */
  navTitle: string
  ariaLabel?: string
  /** Show “← Back to Full Work” under the nav. */
  showBack?: boolean
  backLabel?: string
  children: ReactNode
}

export function WorkInternalUtilityChrome({
  navTitle,
  ariaLabel,
  showBack = false,
  backLabel = '← Back to Full Work',
  children,
}: WorkInternalUtilityChromeProps) {
  const router = useRouter()

  return (
    <>
      <header className="vp-internal-nav" aria-label={ariaLabel ?? navTitle}>
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
          <span aria-hidden="true" />
          <span className="vp-internal-nav__title">{navTitle}</span>
        </div>
      </header>

      {showBack ? (
        <div className="vp-internal-utility__toolbar">
          <button
            type="button"
            className="vp-internal-detail__back"
            onClick={() => {
              router.push(libraryReturnBrowserPath() as '/work-internal')
            }}
          >
            {backLabel}
          </button>
        </div>
      ) : null}

      {children}
    </>
  )
}
