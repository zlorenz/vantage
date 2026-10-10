/**
 * ShowreelVideoLightbox — full-viewport video dialog.
 *
 * Multi-video campaigns: prev/next at the bottom-right of the player.
 * Resume bookmarks keep each clip’s playback position across swipes.
 */

'use client'

import Image from 'next/image'
import {useEffect, useId, useMemo, useRef, useState} from 'react'
import {urlForImage} from '@/lib/sanity'
import {parseVideoUrl} from '@/lib/video-url'
import {vimeoThumbnailUrl} from '@/lib/vimeo'
import {LazyVimeoPlayer} from '@/components/portfolio/LazyVimeoPlayer'
import {LazyYouTubePlayer} from '@/components/ui/LazyYouTubePlayer'
import {LazyXinpianchangPlayer} from '@/components/portfolio/LazyXinpianchangPlayer'
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang'
import type {
  ShowreelPublicItem,
  ShowreelPublicVideo,
} from './showreel-public-types'
import {
  showreelPlayableVideos,
  showreelVideoUrls,
} from './showreel-public-types'

/** 1 = forward (next / from-right), -1 = back (prev / from-left). */
function navDirection(from: number, to: number, length: number): 1 | -1 {
  if (length < 2 || from === to) return 1
  if ((from + 1) % length === to) return 1
  if ((from - 1 + length) % length === to) return -1
  const forwardDist = (to - from + length) % length
  return forwardDist <= length / 2 ? 1 : -1
}

interface ShowreelVideoLightboxProps {
  item: ShowreelPublicItem
  onClose: () => void
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.42 6.29 6.29-6.3 6.3 1.42 1.4 6.29-6.29 6.3 6.3 1.4-1.42-6.29-6.29 6.3-6.3z"
      />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
      />
    </svg>
  )
}

function videoResumeKey(itemId: string, video: ShowreelPublicVideo, index: number) {
  return video._key?.trim() || `${itemId}:${index}`
}

function LightboxClipPlayer({
  item,
  video,
  startAtSeconds,
  onTimeUpdate,
}: {
  item: ShowreelPublicItem
  video: ShowreelPublicVideo
  startAtSeconds: number
  onTimeUpdate: (seconds: number) => void
}) {
  const featuredPoster = item.featuredImage
    ? urlForImage(item.featuredImage).width(1920).height(1080).fit('crop').url()
    : undefined
  const {vimeoUrl, xinpianchangUrl} = showreelVideoUrls(video)
  const parsed = vimeoUrl?.trim() ? parseVideoUrl(vimeoUrl) : null
  const vimeoPoster =
    parsed?.provider === 'vimeo'
      ? (vimeoThumbnailUrl(parsed.url) ?? undefined)
      : undefined
  const posterUrl = featuredPoster ?? vimeoPoster

  if (parsed?.provider === 'youtube') {
    return (
      <LazyYouTubePlayer
        videoId={parsed.id}
        portfolioEntryRef={item._id}
        autoPlay
        inlinePlayback
        startAtSeconds={startAtSeconds}
        onTimeUpdate={onTimeUpdate}
      />
    )
  }

  if (parsed?.provider === 'vimeo') {
    return (
      <LazyVimeoPlayer
        vimeoUrl={parsed.url}
        posterUrl={posterUrl}
        portfolioEntryRef={item._id}
        autoPlay
        inlinePlayback
        startAtSeconds={startAtSeconds}
        onTimeUpdate={onTimeUpdate}
        posterSizes="(max-width: 992px) 100vw, min(1100px, 92vw)"
        priority
      />
    )
  }

  if (xinpianchangUrl && xinpianchangToEmbedUrl(xinpianchangUrl)) {
    return (
      <LazyXinpianchangPlayer
        embedUrl={xinpianchangUrl}
        posterUrl={posterUrl}
        portfolioEntryRef={item._id}
        autoPlay
        inlinePlayback
      />
    )
  }

  return (
    <div className="flex aspect-video items-center justify-center bg-black/80 p-6 text-center text-vp-text-soft">
      No playable video for this project.
    </div>
  )
}

export function ShowreelVideoLightbox({
  item,
  onClose,
}: ShowreelVideoLightboxProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const videos = useMemo(() => showreelPlayableVideos(item), [item])
  const [activeIndex, setActiveIndex] = useState(0)
  const [slideDir, setSlideDir] = useState<1 | -1>(1)
  const [isSliding, setIsSliding] = useState(false)
  const positionsRef = useRef<Record<string, number>>({})
  const currentTimeRef = useRef(0)

  const activeVideo = videos[activeIndex] ?? videos[0] ?? null
  const multi = videos.length > 1
  const resumeKey = activeVideo
    ? videoResumeKey(item._id, activeVideo, activeIndex)
    : ''
  const startAtSeconds = resumeKey
    ? (positionsRef.current[resumeKey] ?? 0)
    : 0

  const title =
    activeVideo?.videoTitle?.trim() || item.title

  const leavePosterUrl = item.featuredImage
    ? urlForImage(item.featuredImage).width(1920).height(1080).fit('crop').url()
    : null

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus the dialog (not Close) so arrow keys don't paint :focus-visible on X.
    panelRef.current?.focus({preventScroll: true})
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (!isSliding) return
    const timer = window.setTimeout(() => setIsSliding(false), 380)
    return () => window.clearTimeout(timer)
  }, [isSliding, resumeKey])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (!multi) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goTo(activeIndex - 1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(activeIndex + 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // goTo closes over latest refs/index — rebind when activeIndex changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [onClose, multi, activeIndex, isSliding])

  function bookmarkActive() {
    if (!activeVideo) return
    const key = videoResumeKey(item._id, activeVideo, activeIndex)
    if (currentTimeRef.current > 0.25) {
      positionsRef.current[key] = currentTimeRef.current
    }
  }

  function goTo(nextIndex: number) {
    if (!multi || videos.length < 1 || isSliding) return
    const wrapped =
      ((nextIndex % videos.length) + videos.length) % videos.length
    if (wrapped === activeIndex) return
    bookmarkActive()
    currentTimeRef.current = 0
    setSlideDir(navDirection(activeIndex, wrapped, videos.length))
    setIsSliding(true)
    setActiveIndex(wrapped)
  }

  if (!activeVideo) {
    return (
      <div
        className="vp-showreel-lightbox"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          ref={panelRef}
          className="vp-showreel-lightbox__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <button
            type="button"
            className="vp-showreel-lightbox__close"
            onClick={onClose}
            aria-label="Close video"
          >
            <CloseIcon />
          </button>
          <p id={titleId} className="vp-showreel-lightbox__title">
            No playable video for this project.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="vp-showreel-lightbox"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="vp-showreel-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="vp-showreel-lightbox__stage">
          <button
            type="button"
            className="vp-showreel-lightbox__close"
            onClick={onClose}
            aria-label="Close video"
          >
            <CloseIcon />
          </button>
          <div className="vp-showreel-lightbox__player">
            <div
              className={
                isSliding
                  ? slideDir === 1
                    ? 'vp-showreel-lightbox__viewport is-sliding is-dir-next'
                    : 'vp-showreel-lightbox__viewport is-sliding is-dir-prev'
                  : 'vp-showreel-lightbox__viewport'
              }
            >
              {isSliding && leavePosterUrl ? (
                <div
                  className="vp-showreel-lightbox__slide vp-showreel-lightbox__slide--leave"
                  aria-hidden="true"
                >
                  <Image
                    src={leavePosterUrl}
                    alt=""
                    fill
                    sizes="(max-width: 992px) 100vw, min(1100px, 92vw)"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div
                key={resumeKey}
                className={
                  isSliding
                    ? 'vp-showreel-lightbox__slide vp-showreel-lightbox__slide--enter'
                    : 'vp-showreel-lightbox__slide'
                }
              >
                <LightboxClipPlayer
                  item={item}
                  video={activeVideo}
                  startAtSeconds={startAtSeconds}
                  onTimeUpdate={(seconds) => {
                    currentTimeRef.current = seconds
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="vp-showreel-lightbox__footer">
          <h2 id={titleId} className="vp-showreel-lightbox__title">
            {title}
          </h2>
          {multi ? (
            <div className="vp-showreel-lightbox__nav">
              <span
                className="vp-showreel-lightbox__count"
                aria-live="polite"
              >
                {activeIndex + 1} / {videos.length}
              </span>
              <button
                type="button"
                className="vp-showreel-lightbox__nav-btn"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous video"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className="vp-showreel-lightbox__nav-btn"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next video"
              >
                <ChevronRightIcon />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
