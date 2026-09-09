/**
 * ShowreelVideoLightbox — full-viewport video dialog.
 *
 * No existing image/video lightbox in the app (ImageGalleryBlock is static;
 * BottomSheet is mobile-sheet chrome). This is a focused overlay for public
 * showreel playback.
 */

'use client'

import {useEffect, useId, useRef} from 'react'
import {urlForImage} from '@/lib/sanity'
import {parseVideoUrl} from '@/lib/video-url'
import {vimeoThumbnailUrl} from '@/lib/vimeo'
import {LazyVimeoPlayer} from '@/components/portfolio/LazyVimeoPlayer'
import {LazyYouTubePlayer} from '@/components/ui/LazyYouTubePlayer'
import {LazyXinpianchangPlayer} from '@/components/portfolio/LazyXinpianchangPlayer'
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang'
import type {ShowreelPublicItem} from './showreel-public-types'
import {showreelItemVideoUrls} from './showreel-public-types'

interface ShowreelVideoLightboxProps {
  item: ShowreelPublicItem
  onClose: () => void
}

function LightboxPlayer({item}: {item: ShowreelPublicItem}) {
  const featuredPoster = item.featuredImage
    ? urlForImage(item.featuredImage).width(1920).height(1080).fit('crop').url()
    : undefined
  const {vimeoUrl, xinpianchangUrl} = showreelItemVideoUrls(item)
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
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="vp-showreel-lightbox"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="vp-showreel-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="vp-showreel-lightbox__chrome">
          <h2 id={titleId} className="vp-showreel-lightbox__title">
            {item.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="vp-showreel-lightbox__close"
            onClick={onClose}
            aria-label="Close video"
          >
            Close
          </button>
        </div>
        <div className="vp-showreel-lightbox__player">
          <LightboxPlayer item={item} />
        </div>
      </div>
    </div>
  )
}
