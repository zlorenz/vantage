'use client'

/**
 * Blog next-post carousel — FeaturedPost slides + prev/next arrows.
 * Reuses Embla loop pattern from PortfolioProjectNavClient; card UI is FeaturedPost.
 */

import {useCallback, useEffect, useState} from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import {FeaturedPost} from '@/components/blog/FeaturedPost'
import type {Locale} from '@/i18n/routing'
import type {BlogPostCard} from '@/types/sanity'
import './blog-post-nav.css'

export type BlogPostNavClientProps = {
  locale: Locale
  phrases: Record<string, string>
  slides: BlogPostCard[]
  readMore: string
  catalogLength: number
}

function NavChevron({direction}: {direction: 'prev' | 'next'}) {
  return (
    <svg
      className="vp-blog-nav__arrow-icon"
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

export function BlogPostNavClient({
  locale,
  phrases,
  slides,
  readMore,
  catalogLength,
}: BlogPostNavClientProps) {
  const count = slides.length
  const canLoop = count > 1

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: canLoop,
    align: 'start',
    containScroll: false,
    dragFree: false,
    startIndex: 0,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi])

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
      if (event.key === 'ArrowRight') emblaApi.scrollNext()
      else emblaApi.scrollPrev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [emblaApi, canLoop])

  if (count < 1) return null

  return (
    <section
      className="vp-blog-nav"
      aria-label="Next post"
      data-catalog-length={catalogLength}
      data-slide-count={count}
      data-selected-index={selectedIndex}
    >
      <div className="vp-blog-nav__chrome">
        <div className="vp-blog-nav__arrows">
          <button
            type="button"
            className="vp-blog-nav__arrow vp-blog-nav__arrow--prev"
            onClick={scrollPrev}
            aria-label="Previous post"
            disabled={!canLoop}
          >
            <NavChevron direction="prev" />
          </button>
          <button
            type="button"
            className="vp-blog-nav__arrow vp-blog-nav__arrow--next"
            onClick={scrollNext}
            aria-label="Next post"
            disabled={!canLoop}
          >
            <NavChevron direction="next" />
          </button>
        </div>
      </div>

      <div ref={emblaRef} className="vp-blog-nav__viewport">
        <div className="vp-blog-nav__container">
          {slides.map((slide, index) => (
            <div className="vp-blog-nav__slide" key={slide._id}>
              <FeaturedPost
                post={slide}
                locale={locale}
                phrases={phrases}
                readMore={readMore}
                priority={index === 0}
                className="vp-blog-nav__card"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
