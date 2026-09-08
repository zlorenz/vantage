'use client'

/**
 * Interactive project-nav chrome — left panel, right cover/meta, bottom
 * EXPLORE + prev/next cycling the ±5 neighbor window (Figma 92:40293).
 */

import {useCallback, useMemo, useState} from 'react'
import Image from 'next/image'
import {phraseRecordToMap} from '@phrase-book'
import {PortfolioEntryLink} from '@/components/navigation/PortfolioEntryLink'
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

function NavChevron({direction}: {direction: 'prev' | 'next'}) {
  return (
    <svg
      className="vp-project-nav__arrow-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          direction === 'prev'
            ? 'M14.5 5.5 8 12l6.5 6.5'
            : 'M9.5 5.5 16 12l-6.5 6.5'
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
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

  const [localIndex, setLocalIndex] = useState(startLocal)
  const count = cards.length

  const goPrev = useCallback(() => {
    setLocalIndex((i) => (i - 1 + count) % count)
  }, [count])

  const goNext = useCallback(() => {
    setLocalIndex((i) => (i + 1) % count)
  }, [count])

  const active = cards[localIndex]
  if (!active || count < 1) return null

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

  const slugParam =
    locale === 'zh' ? active.slugZh || active.slug || '' : active.slug || ''

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

          <div className="vp-project-nav__chrome">
            {slugParam ? (
              <PortfolioEntryLink
                slug={slugParam}
                className="vp-project-nav__explore"
              >
                explore
              </PortfolioEntryLink>
            ) : (
              <span className="vp-project-nav__explore" aria-disabled>
                explore
              </span>
            )}
            <div className="vp-project-nav__arrows">
              <button
                type="button"
                className="vp-project-nav__arrow vp-project-nav__arrow--prev"
                onClick={goPrev}
                aria-label="Previous project"
              >
                <NavChevron direction="prev" />
              </button>
              <button
                type="button"
                className="vp-project-nav__arrow vp-project-nav__arrow--next"
                onClick={goNext}
                aria-label="Next project"
              >
                <NavChevron direction="next" />
              </button>
            </div>
          </div>
        </div>

        <div className="vp-project-nav__right">
          {imageUrl ? (
            <Image
              key={active._id}
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
