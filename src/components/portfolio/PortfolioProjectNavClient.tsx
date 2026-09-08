'use client'

/**
 * Project-nav carousel — Embla strip (loop) matching multi-video case
 * gestures: drag/swipe, horizontal wheel paging, keyboard, arrow buttons.
 * One dual-panel slide visible at a time (no peek); horizontal snap animation.
 */

import {useCallback, useEffect, useMemo, useRef} from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import {WheelGestures} from 'wheel-gestures'
import {phraseRecordToMap} from '@phrase-book'
import {PortfolioEntryLink} from '@/components/navigation/PortfolioEntryLink'
import type {Locale} from '@/i18n/routing'
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles'
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field'
import {urlForImage} from '@/lib/sanity'
import type {PortfolioNavCard} from '@/lib/portfolio-nav'

/** Same threshold as PortfolioCaseCarousel horizontal wheel paging. */
const WHEEL_GESTURE_THRESHOLD_PX = 30

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

function slideCopy(
  card: PortfolioNavCard,
  locale: Locale,
  phrases: Record<string, string>,
) {
  const phraseMap = phraseRecordToMap(phrases)
  const parts = resolveEntryDisplayTitleParts(card, locale, phraseMap)
  const brandLine = parts.brandName?.trim() ?? ''
  const titleLine =
    parts.campaignTitle?.trim() ||
    pickLocaleFieldWithPhrases(
      locale,
      card.title,
      card.titleZh,
      phraseMap,
    ).trim()
  const formatLine = pickLocaleFieldWithPhrases(
    locale,
    card.primaryFormat?.title,
    card.primaryFormat?.titleZh,
    phraseMap,
  ).trim()
  const imageUrl = card.featuredImage
    ? urlForImage(card.featuredImage)
        .width(1250)
        .height(624)
        .fit('crop')
        .url()
    : null
  const slugParam =
    locale === 'zh' ? card.slugZh || card.slug || '' : card.slug || ''
  return {brandLine, titleLine, formatLine, imageUrl, slugParam}
}

export function PortfolioProjectNavClient({
  locale,
  phrases,
  cards,
  cardRingIndices,
  initialRingIndex,
}: PortfolioProjectNavClientProps) {
  const startIndex = useMemo(() => {
    const idx = cardRingIndices.indexOf(initialRingIndex)
    return idx >= 0 ? idx : 0
  }, [cardRingIndices, initialRingIndex])

  const count = cards.length
  const canLoop = count > 1

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: canLoop,
    align: 'start',
    containScroll: false,
    dragFree: false,
    startIndex,
  })

  const gestureAccumRef = useRef(0)
  const gestureFiredRef = useRef(false)

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  // Horizontal-only wheel paging — same pattern as PortfolioCaseCarousel.
  useEffect(() => {
    if (!emblaApi || !canLoop) return

    const viewport = emblaApi.rootNode()
    const wheelGestures = WheelGestures({
      reverseSign: false,
      preventWheelAction: false,
    })

    const unobserve = wheelGestures.observe(viewport)
    const unsubscribe = wheelGestures.on('wheel', (wheelEventState) => {
      const {isStart, isMomentum, axisDelta, event} = wheelEventState
      const [deltaX, deltaY] = axisDelta

      if (isStart) {
        gestureAccumRef.current = 0
        gestureFiredRef.current = false
      }

      if (event.ctrlKey) return
      if (Math.abs(deltaX) <= Math.abs(deltaY) || deltaX === 0) return

      event.preventDefault?.()
      if (isMomentum) return

      gestureAccumRef.current += Math.abs(deltaX)
      if (gestureFiredRef.current) return
      if (gestureAccumRef.current < WHEEL_GESTURE_THRESHOLD_PX) return

      gestureFiredRef.current = true
      if (deltaX > 0) {
        emblaApi.scrollNext()
      } else {
        emblaApi.scrollPrev()
      }
    })

    return () => {
      unsubscribe()
      unobserve()
      wheelGestures.disconnect()
    }
  }, [emblaApi, canLoop])

  useEffect(() => {
    if (!emblaApi || !canLoop) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      if (event.key === 'ArrowRight') {
        emblaApi.scrollNext()
      } else {
        emblaApi.scrollPrev()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [emblaApi, canLoop])

  if (count < 1) return null

  return (
    <section
      className="vp-project-nav"
      aria-label="Next project"
      data-ring-start={initialRingIndex}
    >
      <div className="vp-project-nav__frame">
        <div className="vp-project-nav__ticks" aria-hidden="true">
          <span className="vp-project-nav__tick vp-project-nav__tick--tl" />
          <span className="vp-project-nav__tick vp-project-nav__tick--tr" />
          <span className="vp-project-nav__tick vp-project-nav__tick--bl" />
          <span className="vp-project-nav__tick vp-project-nav__tick--br" />
        </div>

        <div
          ref={emblaRef}
          className="vp-project-nav__viewport"
          aria-roledescription="carousel"
        >
          <div className="vp-project-nav__container">
            {cards.map((card, index) => {
              const {
                brandLine,
                titleLine,
                formatLine,
                imageUrl,
                slugParam,
              } = slideCopy(card, locale, phrases)

              return (
                <div
                  className="vp-project-nav__slide"
                  key={card._id}
                  data-ring-index={cardRingIndices[index]}
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
                            onClick={scrollPrev}
                            aria-label="Previous project"
                            disabled={!canLoop}
                          >
                            <NavChevron direction="prev" />
                          </button>
                          <button
                            type="button"
                            className="vp-project-nav__arrow vp-project-nav__arrow--next"
                            onClick={scrollNext}
                            aria-label="Next project"
                            disabled={!canLoop}
                          >
                            <NavChevron direction="next" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="vp-project-nav__right">
                      {imageUrl ? (
                        <Image
                          className="vp-project-nav__cover"
                          src={imageUrl}
                          alt=""
                          fill
                          sizes="(max-width: 991px) 100vw, 65vw"
                          priority={index === startIndex}
                        />
                      ) : (
                        <div
                          className="vp-project-nav__cover-fallback"
                          aria-hidden
                        />
                      )}
                      <div
                        className="vp-project-nav__cover-gradient"
                        aria-hidden
                      />
                      <CrosshairMark />
                      <div className="vp-project-nav__meta">
                        {(brandLine || formatLine) && (
                          <div className="vp-project-nav__meta-row">
                            {brandLine ? (
                              <p className="vp-project-nav__brand">{`●  ${brandLine}`}</p>
                            ) : null}
                            {brandLine && formatLine ? (
                              <span
                                className="vp-project-nav__meta-rule"
                                aria-hidden
                              />
                            ) : null}
                            {formatLine ? (
                              <p className="vp-project-nav__format">
                                {formatLine}
                              </p>
                            ) : null}
                          </div>
                        )}
                        {titleLine ? (
                          <p className="vp-project-nav__title">{titleLine}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
