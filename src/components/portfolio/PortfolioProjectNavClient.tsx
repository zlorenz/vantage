'use client'

/**
 * Interactive project-nav chrome — left panel (Commit 2), right panel / arrows
 * land in later commits.
 */

import type {Locale} from '@/i18n/routing'
import type {PortfolioNavCard} from '@/lib/portfolio-nav'

export type PortfolioProjectNavClientProps = {
  locale: Locale
  phrases: Record<string, string>
  cards: PortfolioNavCard[]
  cardRingIndices: number[]
  initialRingIndex: number
  ringLength: number
}

export function PortfolioProjectNavClient({
  cards,
  cardRingIndices,
  initialRingIndex,
}: PortfolioProjectNavClientProps) {
  const startLocal =
    cardRingIndices.indexOf(initialRingIndex) >= 0
      ? cardRingIndices.indexOf(initialRingIndex)
      : 0
  const active = cards[startLocal]
  if (!active) return null

  return (
    <section
      className="vp-project-nav"
      aria-label="Next project"
      data-ring-start={initialRingIndex}
    >
      <div className="vp-project-nav__widget">
        <div className="vp-project-nav__left">
          <div className="vp-project-nav__heading">
            <p className="vp-project-nav__label">Next Project</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="vp-project-nav__mark"
            src="/brand/vap-pattern.svg"
            alt=""
            aria-hidden="true"
          />
        </div>
        <div className="vp-project-nav__right" aria-hidden="true" />
      </div>
    </section>
  )
}
