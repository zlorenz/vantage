'use client'

/**
 * Project-nav carousel — fixed left chrome; Embla card track with on-demand
 * card hydration. Thin slide refs ship for the full chronological ring; full
 * card payloads (+ Next/Image) load for a ±radius window around the active
 * slide via /api/portfolio-nav-cards.
 */

import {useCallback, useEffect, useRef, useState} from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import {WheelGestures} from 'wheel-gestures'
import {phraseRecordToMap} from '@phrase-book'
import {PortfolioEntryLink} from '@/components/navigation/PortfolioEntryLink'
import {composeOverlayCopy} from '@/components/prototype/carousel/overlay'
import type {Locale} from '@/i18n/routing'
import {resolveEntryDisplayTitleParts} from '@/lib/display-titles'
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field'
import {urlForImage} from '@/lib/sanity'
import {
  loopDistance,
  neighborIndices,
  PORTFOLIO_NAV_PREFETCH_RADIUS,
  type PortfolioNavCard,
  type PortfolioNavSlideRef,
} from '@/lib/portfolio-nav'

/** Same threshold as PortfolioCaseCarousel horizontal wheel paging. */
const WHEEL_GESTURE_THRESHOLD_PX = 30
/** Only mount <Image> for slides this close to the active index (loop-aware). */
const IMAGE_MOUNT_RADIUS = 2

export type PortfolioProjectNavClientProps = {
  locale: Locale
  phrases: Record<string, string>
  slides: PortfolioNavSlideRef[]
  initialCards: PortfolioNavCard[]
  catalogLength: number
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

function cardsToMap(cards: PortfolioNavCard[]): Record<string, PortfolioNavCard> {
  const map: Record<string, PortfolioNavCard> = {}
  for (const card of cards) {
    map[card._id] = card
  }
  return map
}

function slideCopy(
  card: PortfolioNavCard,
  locale: Locale,
  phrases: Record<string, string>,
) {
  const phraseMap = phraseRecordToMap(phrases)
  const parts = resolveEntryDisplayTitleParts(card, locale, phraseMap)
  // Same Brand/Product/Campaign split (+ brand/product dedup) as home + /work.
  const {brandLine, campaignLine: titleLine} = composeOverlayCopy(parts)
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
  return {brandLine, titleLine, formatLine, imageUrl}
}

function slugForSlide(slide: PortfolioNavSlideRef, locale: Locale): string {
  return locale === 'zh' ? slide.slugZh || slide.slug : slide.slug
}

export function PortfolioProjectNavClient({
  locale,
  phrases,
  slides,
  initialCards,
  catalogLength,
}: PortfolioProjectNavClientProps) {
  const startIndex = 0
  const count = slides.length
  const canLoop = count > 1

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: canLoop,
    align: 'start',
    containScroll: false,
    dragFree: false,
    startIndex,
  })

  const [selectedIndex, setSelectedIndex] = useState(startIndex)
  const [cardsById, setCardsById] = useState(() => cardsToMap(initialCards))
  const cardsByIdRef = useRef(cardsById)
  cardsByIdRef.current = cardsById
  const pendingIdsRef = useRef(new Set<string>())
  const gestureAccumRef = useRef(0)
  const gestureFiredRef = useRef(false)

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi])

  // Hydrate missing cards in the prefetch window around the active slide.
  useEffect(() => {
    if (count < 1) return

    const needed = neighborIndices(
      selectedIndex,
      count,
      PORTFOLIO_NAV_PREFETCH_RADIUS,
    )
      .map((idx) => slides[idx]!._id)
      .filter(
        (id) => !cardsByIdRef.current[id] && !pendingIdsRef.current.has(id),
      )

    if (needed.length === 0) return

    for (const id of needed) pendingIdsRef.current.add(id)
    let cancelled = false

    const params = new URLSearchParams({ids: needed.join(',')})
    void fetch(`/api/portfolio-nav-cards?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`nav cards ${res.status}`)
        return res.json() as Promise<{cards: PortfolioNavCard[]}>
      })
      .then((body) => {
        if (cancelled) return
        setCardsById((prev) => {
          const next = {...prev}
          for (const card of body.cards ?? []) {
            next[card._id] = card
          }
          return next
        })
      })
      .catch(() => {
        /* Non-fatal — placeholders stay until a later pass. */
      })
      .finally(() => {
        for (const id of needed) pendingIdsRef.current.delete(id)
      })

    return () => {
      cancelled = true
      // Free pending slots so a new selectedIndex effect can re-request.
      for (const id of needed) pendingIdsRef.current.delete(id)
    }
  }, [selectedIndex, count, slides])

  // Horizontal-only wheel paging — observe the card viewport only (right band).
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

  const activeSlide = slides[selectedIndex] ?? slides[0]!
  const activeSlug = slugForSlide(activeSlide, locale)

  return (
    <section
      className="vp-project-nav"
      aria-label="Next project"
      data-catalog-length={catalogLength}
      data-slide-count={count}
    >
      <div className="vp-project-nav__frame">
        <div className="vp-project-nav__ticks" aria-hidden="true">
          <span className="vp-project-nav__tick vp-project-nav__tick--tl" />
          <span className="vp-project-nav__tick vp-project-nav__tick--tr" />
          <span className="vp-project-nav__tick vp-project-nav__tick--bl" />
          <span className="vp-project-nav__tick vp-project-nav__tick--br" />
        </div>

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
              {activeSlug ? (
                <PortfolioEntryLink
                  slug={activeSlug}
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

          <div
            ref={emblaRef}
            className="vp-project-nav__viewport"
            aria-roledescription="carousel"
          >
            <div className="vp-project-nav__container">
              {slides.map((slide, index) => {
                const card = cardsById[slide._id]
                const mountImage =
                  Boolean(card) &&
                  loopDistance(index, selectedIndex, count) <= IMAGE_MOUNT_RADIUS
                const copy = card ? slideCopy(card, locale, phrases) : null

                return (
                  <div className="vp-project-nav__slide" key={slide._id}>
                    <div className="vp-project-nav__card">
                      {mountImage && copy?.imageUrl ? (
                        <Image
                          className="vp-project-nav__cover"
                          src={copy.imageUrl}
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
                      {copy ? (
                        <div className="vp-project-nav__meta">
                          {(copy.brandLine || copy.formatLine) && (
                            <div className="vp-project-nav__meta-row">
                              {copy.brandLine ? (
                                <p className="vp-project-nav__brand">{`●  ${copy.brandLine}`}</p>
                              ) : null}
                              {copy.brandLine && copy.formatLine ? (
                                <span
                                  className="vp-project-nav__meta-rule"
                                  aria-hidden
                                />
                              ) : null}
                              {copy.formatLine ? (
                                <p className="vp-project-nav__format">
                                  {copy.formatLine}
                                </p>
                              ) : null}
                            </div>
                          )}
                          {copy.titleLine ? (
                            <p className="vp-project-nav__title">
                              {copy.titleLine}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
