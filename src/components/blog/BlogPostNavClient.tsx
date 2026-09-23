'use client'

/**
 * Blog next-post carousel — portfolio project-nav chrome pattern.
 * Fixed Read More + arrows; synced Embla tracks wipe left copy + right poster.
 */

import {useCallback, useEffect, useState} from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import {Link} from '@/i18n/navigation'
import {resolveBlogCardExcerpt} from '@/lib/blog-excerpt'
import {pickLocaleFieldWithPhrases} from '@/lib/locale-field'
import {urlForImage} from '@/lib/sanity'
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

const EMBLA_OPTIONS = {
  align: 'start' as const,
  containScroll: false as const,
  dragFree: false,
  startIndex: 0,
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

function ReadMoreArrow() {
  return (
    <svg
      className="vp-blog-nav__cta-arrow"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M4.2 12.9 11.4 5.7H6.75V4.2H14.1v7.35h-1.5V6.9L5.4 14.1z"
      />
    </svg>
  )
}

function formatPillDate(dateString: string, locale: Locale): string {
  return new Date(dateString).toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    {year: 'numeric', month: 'short', day: 'numeric'},
  )
}

function slideHref(post: BlogPostCard, locale: Locale) {
  const slug = locale === 'zh' ? post.slugZh || post.slug : post.slug
  return {pathname: '/[slug]' as const, params: {slug}}
}

function slideCopy(
  post: BlogPostCard,
  locale: Locale,
  phrases: Record<string, string>,
) {
  const title = pickLocaleFieldWithPhrases(
    locale,
    post.title,
    post.titleZh,
    phrases,
  )
  const excerpt = resolveBlogCardExcerpt(
    pickLocaleFieldWithPhrases(locale, post.excerpt, post.excerptZh, phrases),
    pickLocaleFieldWithPhrases(locale, post.bodyText, post.bodyTextZh, phrases),
  )
  const imageUrl = post.featuredImage
    ? urlForImage(post.featuredImage).width(1200).height(680).fit('crop').url()
    : null
  return {title, excerpt, imageUrl, categories: post.categories ?? []}
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
  const options = {...EMBLA_OPTIONS, loop: canLoop}

  const [copyRef, copyApi] = useEmblaCarousel({
    ...options,
    watchDrag: false, // copy follows media; no independent drag
  })
  const [mediaRef, mediaApi] = useEmblaCarousel(options)

  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    mediaApi?.scrollPrev()
    copyApi?.scrollPrev()
  }, [mediaApi, copyApi])

  const scrollNext = useCallback(() => {
    mediaApi?.scrollNext()
    copyApi?.scrollNext()
  }, [mediaApi, copyApi])

  // Media drag/wheel is source of truth; keep copy index matched after settle.
  useEffect(() => {
    if (!mediaApi || !copyApi) return

    const syncFromMedia = () => {
      const index = mediaApi.selectedScrollSnap()
      setSelectedIndex(index)
      if (copyApi.selectedScrollSnap() !== index) {
        copyApi.scrollTo(index)
      }
    }

    syncFromMedia()
    mediaApi.on('select', syncFromMedia)
    mediaApi.on('reInit', syncFromMedia)
    return () => {
      mediaApi.off('select', syncFromMedia)
      mediaApi.off('reInit', syncFromMedia)
    }
  }, [mediaApi, copyApi])

  useEffect(() => {
    if (!mediaApi || !canLoop) return
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
      if (event.key === 'ArrowRight') mediaApi.scrollNext()
      else mediaApi.scrollPrev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mediaApi, canLoop])

  if (count < 1) return null

  const active = slides[selectedIndex] ?? slides[0]!
  const activeHref = slideHref(active, locale)

  return (
    <section
      className="vp-blog-nav"
      aria-label="Next post"
      data-catalog-length={catalogLength}
      data-slide-count={count}
      data-selected-index={selectedIndex}
    >
      <div className="vp-blog-nav__frame">
        <div className="vp-blog-nav__ticks" aria-hidden="true">
          <span className="vp-blog-nav__tick vp-blog-nav__tick--tl" />
          <span className="vp-blog-nav__tick vp-blog-nav__tick--tr" />
          <span className="vp-blog-nav__tick vp-blog-nav__tick--bl" />
          <span className="vp-blog-nav__tick vp-blog-nav__tick--br" />
        </div>

        <div className="vp-blog-nav__widget">
          <div className="vp-blog-nav__left">
            <div ref={copyRef} className="vp-blog-nav__copy-viewport">
              <div className="vp-blog-nav__copy-container">
                {slides.map((slide) => {
                  const copy = slideCopy(slide, locale, phrases)
                  const href = slideHref(slide, locale)
                  return (
                    <div className="vp-blog-nav__copy-slide" key={slide._id}>
                      <div className="vp-blog-nav__copy">
                        {copy.categories.length ? (
                          <div className="vp-blog-nav__pills">
                            {copy.categories.map((category) => {
                              const catSlug =
                                locale === 'zh'
                                  ? category.slugZh || category.slug
                                  : category.slug
                              const catLabel = pickLocaleFieldWithPhrases(
                                locale,
                                category.title,
                                category.titleZh,
                                phrases,
                              )
                              return (
                                <Link
                                  key={category._id}
                                  href={{
                                    pathname: '/category/[slug]',
                                    params: {slug: catSlug},
                                  }}
                                  className="vp-blog-nav__pill"
                                  tabIndex={
                                    slide._id === active._id ? undefined : -1
                                  }
                                >
                                  {catLabel}
                                </Link>
                              )
                            })}
                          </div>
                        ) : null}

                        <div className="vp-blog-nav__text">
                          <h2 className="vp-blog-nav__title">
                            <Link
                              href={href}
                              tabIndex={
                                slide._id === active._id ? undefined : -1
                              }
                            >
                              {copy.title}
                            </Link>
                          </h2>
                          {copy.excerpt ? (
                            <p className="vp-blog-nav__excerpt">{copy.excerpt}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="vp-blog-nav__mark"
              src="/brand/vap-pattern.svg"
              alt=""
              aria-hidden="true"
            />

            <div className="vp-blog-nav__chrome">
              <Link href={activeHref} className="vp-blog-nav__cta">
                <span className="vp-blog-nav__cta-label">{readMore}</span>
                <ReadMoreArrow />
              </Link>
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
          </div>

          <div
            ref={mediaRef}
            className="vp-blog-nav__media-viewport"
            aria-roledescription="carousel"
          >
            <div className="vp-blog-nav__media-container">
              {slides.map((slide, index) => {
                const copy = slideCopy(slide, locale, phrases)
                const href = slideHref(slide, locale)
                return (
                  <div className="vp-blog-nav__media-slide" key={slide._id}>
                    <Link
                      href={href}
                      className="vp-blog-nav__media"
                      aria-label={copy.title}
                      tabIndex={slide._id === active._id ? undefined : -1}
                    >
                      {slide.publishedAt ? (
                        <time
                          className="vp-blog-nav__date-pill"
                          dateTime={slide.publishedAt}
                        >
                          {formatPillDate(slide.publishedAt, locale)}
                        </time>
                      ) : null}
                      {copy.imageUrl ? (
                        <Image
                          src={copy.imageUrl}
                          alt=""
                          width={1200}
                          height={680}
                          className="vp-blog-nav__image"
                          sizes="(max-width: 1023px) 100vw, 60vw"
                          priority={index === 0}
                          draggable={false}
                        />
                      ) : (
                        <div
                          className="vp-blog-nav__image-fallback"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
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
