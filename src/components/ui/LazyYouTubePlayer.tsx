'use client';

/**
 * LazyYouTubePlayer — YouTube poster until play; then loads embed iframe.
 *
 * Mobile (and carousel cards via `fullscreenOnPlay`): playsinline=0 / element
 * fullscreen on play. Exiting fullscreen restores the poster.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { youTubePosterUrl } from '@/lib/youtube';
import { trackVideoEvent } from '@/lib/video-events';

interface LazyYouTubePlayerProps {
  videoId: string;
  title?: string;
  /** Sanity portfolioEntry document id (weak ref on analytics write). */
  portfolioEntryRef?: string;
  /** Fires once when the user starts playback from the poster. */
  onPlay?: () => void;
  /** Fires when playback stops (fullscreen exit, etc.). */
  onStop?: () => void;
  /** Hide the centered play glyph (poster remains clickable). */
  hidePlayButton?: boolean;
  /** Carousel: open fullscreen on play; exit restores poster on all viewports. */
  fullscreenOnPlay?: boolean;
}

/** Touch phones/tablets (and narrow viewports): expand to fullscreen on first play. */
function prefersMobileFullscreen(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
    window.matchMedia('(max-width: 767px)').matches
  );
}

function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
  };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function requestElementFullscreen(el: HTMLElement): void {
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => void;
    webkitRequestFullScreen?: () => void;
  };
  if (typeof el.requestFullscreen === 'function') {
    void el.requestFullscreen().catch(() => {});
    return;
  }
  anyEl.webkitRequestFullscreen?.();
  anyEl.webkitRequestFullScreen?.();
}

export function LazyYouTubePlayer({
  videoId,
  title = 'YouTube video',
  portfolioEntryRef,
  onPlay,
  onStop,
  hidePlayButton = false,
  fullscreenOnPlay = false,
}: LazyYouTubePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [posterSrc, setPosterSrc] = useState(youTubePosterUrl(videoId, 'maxres'));
  const wrapRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(false);
  const enteredFullscreenRef = useRef(false);
  const fullscreenPlaybackRef = useRef(false);
  const pendingElementFsRef = useRef(false);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
  playingRef.current = playing;

  const stopPlayback = useCallback(() => {
    if (!playingRef.current) return;
    enteredFullscreenRef.current = false;
    fullscreenPlaybackRef.current = false;
    pendingElementFsRef.current = false;
    setPlaying(false);
    setNativeFullscreen(false);
    onStopRef.current?.();
  }, []);

  // Carousel / mobile: element fullscreen right after the iframe mounts.
  useEffect(() => {
    if (!playing || !pendingElementFsRef.current) return;
    pendingElementFsRef.current = false;
    const wrap = wrapRef.current;
    if (!wrap) return;
    enteredFullscreenRef.current = true;
    requestElementFullscreen(wrap);
  }, [playing]);

  // FS-on-play: exiting fullscreen returns to poster browse.
  useEffect(() => {
    if (!playing || !fullscreenPlaybackRef.current) return;

    const onDocFsChange = () => {
      const fsEl = getFullscreenElement();
      if (fsEl) {
        enteredFullscreenRef.current = true;
        return;
      }
      if (!enteredFullscreenRef.current) return;
      stopPlayback();
    };

    document.addEventListener('fullscreenchange', onDocFsChange);
    document.addEventListener('webkitfullscreenchange', onDocFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onDocFsChange);
      document.removeEventListener('webkitfullscreenchange', onDocFsChange);
    };
  }, [playing, stopPlayback]);

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid YouTube URL
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative aspect-video w-full bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
            autoplay: '1',
            ...(nativeFullscreen ? { playsinline: '0' } : {}),
          }).toString()}`}
          title={title}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="group absolute inset-0 block w-full cursor-pointer border-0 bg-black p-0"
          onClick={() => {
            trackVideoEvent({
              eventType: 'click_play',
              source: 'youtube',
              videoId,
              portfolioEntryRef,
            });
            const mobile = prefersMobileFullscreen();
            const wantsFullscreen = fullscreenOnPlay || mobile;
            fullscreenPlaybackRef.current = wantsFullscreen;
            if (wantsFullscreen) {
              pendingElementFsRef.current = true;
            }
            setNativeFullscreen(wantsFullscreen);
            setPlaying(true);
            onPlay?.();
          }}
          aria-label={`Play ${title}`}
        >
          <Image
            src={posterSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 992px) 100vw, 60vw"
            onError={() => setPosterSrc(youTubePosterUrl(videoId, 'hq'))}
          />
          {!hidePlayButton ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/90 bg-black/40 transition duration-200 group-hover:scale-110 group-hover:border-white group-hover:bg-black/55">
                <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
              </span>
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}
