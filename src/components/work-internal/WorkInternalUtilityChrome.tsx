/**
 * WorkInternalUtilityChrome — minimal fixed nav + optional back toolbar for
 * internal utility pages (showreel editor/login, etc.).
 *
 * Brand mark opens the marketing homepage in a new tab (same as library nav).
 */

'use client'

import type {ReactNode} from 'react'
import {useRouter} from 'next/navigation'
import {
  libraryReturnBrowserPath,
  marketingHomeUrl,
} from '@/lib/internal-app-paths'
import {
  WorkInternalNavIndexMenu,
  type WorkInternalNavSection,
} from './WorkInternalNavIndexMenu'

interface WorkInternalUtilityChromeProps {
  /** Right-side label in the fixed nav (e.g. "Showreel editor"). */
  navTitle: string
  ariaLabel?: string
  /**
   * When set, replace the static nav title with the library ↔ showreels
   * index switcher (current section highlighted).
   */
  sectionNav?: WorkInternalNavSection
  /** Show a back control under the nav. */
  showBack?: boolean
  backLabel?: string
  /** Override destination (defaults to the work library return path). */
  backHref?: string
  children: ReactNode
}

export function WorkInternalUtilityChrome({
  navTitle,
  ariaLabel,
  sectionNav,
  showBack = false,
  backLabel = '← Back to Full Work',
  backHref,
  children,
}: WorkInternalUtilityChromeProps) {
  const router = useRouter()

  return (
    <>
      <header className="vp-internal-nav" aria-label={ariaLabel ?? navTitle}>
        <div className="vp-internal-nav__inner">
          <a
            className="vp-internal-nav__brand"
            href={marketingHomeUrl()}
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
          </a>
          <span aria-hidden="true" />
          {sectionNav ? (
            <WorkInternalNavIndexMenu current={sectionNav} />
          ) : (
            <span className="vp-internal-nav__title">{navTitle}</span>
          )}
        </div>
      </header>

      {showBack ? (
        <div className="vp-internal-utility__toolbar">
          <button
            type="button"
            className="vp-internal-detail__back"
            onClick={() => {
              router.push(backHref ?? libraryReturnBrowserPath())
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
