'use client'

/**
 * Interactive project-nav chrome — left panel + right cover/meta (Figma 92:40293).
 * Arrow / EXPLORE wiring lands in the next commit; starts on chronological next.
 */

import {useMemo, useState} from 'react'
import Image from 'next/image'
import {phraseRecordToMap} from '@phrase-book'
import type {Locale} from '@/i18n/routing'
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles'
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field'
import {urlForImage} from '@/lib/sanity'
import type {PortfolioNavCard} from '@/lib/portfolio-nav'

export type PortfolioProjectNavClientProps = {
  locale: Locale
  phrases: Record<string, string>
  cards: PortfolioNavCard[]
  cardRingIndices: number[]
  initialRingIndex: number
  ringLength: number
}

function CrosshairMark() {
  return (
    <svg
      className="vp-project-nav__crosshair"
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="0" y1="20" x2="40" y2="20" />
      <line x1="20" y1="0" x2="20" y2="40" />
    </svg>
  )
}

export function PortfolioProjectNavClient({
  locale,
  phrases,
  cards,
  cardRingIndices,
  initialRingIndex,
}: PortfolioProjectNavClientProps) {
  const startLocal = useMemo(() => {
    const idx = cardRingIndices.indexOf(initialRingIndex)
    return idx >= 0 ? idx : 0
  }, [cardRingIndices, initialRingIndex])

  const [localIndex] = useState(startLocal)
  const active = cards[localIndex]
  if (!active) return null

  const phraseMap = phraseRecordToMap(phrases)
  const parts = resolveEntryDisplayTitleParts(active, locale, phraseMap)
  const brandLine = parts.brandName?.trim() ?? ''
  const titleLine =
    parts.campaignTitle?.trim() ||
    pickLocaleFieldWithPhrases(
      locale,
      active.title,
      active.titleZh,
      phraseMap,
    ).trim()
  const formatLine = pickLocaleFieldWithPhrases(
    locale,
    active.primaryFormat?.title,
    active.primaryFormat?.titleZh,
    phraseMap,
  ).trim()

  const imageUrl = active.featuredImage
    ? urlForImage(active.featuredImage)
        .width(1250)
        .height(624)
        .fit('crop')
        .url()
    : null

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

        <div className="vp-project-nav__right">
          {imageUrl ? (
            <Image
              className="vp-project-nav__cover"
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 991px) 100vw, 65vw"
              priority={false}
            />
          ) : (
            <div className="vp-project-nav__cover-fallback" aria-hidden />
          )}
          <div className="vp-project-nav__cover-gradient" aria-hidden />
          <CrosshairMark />
          <div className="vp-project-nav__meta">
            {(brandLine || formatLine) && (
              <div className="vp-project-nav__meta-row">
                {brandLine ? (
                  <p className="vp-project-nav__brand">{`●  ${brandLine}`}</p>
                ) : null}
                {brandLine && formatLine ? (
                  <span className="vp-project-nav__meta-rule" aria-hidden />
                ) : null}
                {formatLine ? (
                  <p className="vp-project-nav__format">{formatLine}</p>
                ) : null}
              </div>
            )}
            {titleLine ? (
              <p className="vp-project-nav__title">{titleLine}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
