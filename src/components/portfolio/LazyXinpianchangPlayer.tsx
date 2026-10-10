'use client';

/**
 * LazyXinpianchangPlayer — poster until play; then loads validated embed iframe.
 *
 * Carousel cards (`fullscreenOnPlay`): element fullscreen on play (sync in
 * gesture); exit restores the poster.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import { extractXinpianchangMid, xinpianchangToEmbedUrl } from '@/lib/xinpianchang';
import { trackVideoEvent } from '@/lib/video-events';

interface LazyXinpianchangPlayerProps {
  embedUrl: string;
  posterUrl?: string;
  posterAlt?: string;
  /** Sanity portfolioEntry document id (weak ref on analytics write). */
  portfolioEntryRef?: string;
  /** Fires once when the user starts playback from the poster. */
  onPlay?: () => void;
  /** Fires when playback stops (parent remount / fullscreen exit). */
  onStop?: () => void;
  /** Hide the centered play glyph (poster remains clickable). */
  hidePlayButton?: boolean;
  /** Carousel: open fullscreen on play; exit restores poster on all viewports. */
  fullscreenOnPlay?: boolean;
  /** Start playback on mount (e.g. lightbox opened from a poster click). */
  autoPlay?: boolean;
  /**
   * Keep playback inline (no carousel fullscreen-on-play).
   * Use for lightbox where a separate fullscreen control is available.
   */
  inlinePlayback?: boolean;
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

function exitDocumentFullscreen(): void {
  const doc = document as Document & {
    webkitExitFullscreen?: () => void;
  };
  if (!getFullscreenElement()) return;
  void document.exitFullscreen?.().catch(() => {});
  doc.webkitExitFullscreen?.();
}

export function LazyXinpianchangPlayer({
  embedUrl,
  posterUrl,
  posterAlt = '',
  portfolioEntryRef,
  onPlay,
  onStop,
  hidePlayButton = false,
  fullscreenOnPlay = false,
  autoPlay = false,
  inlinePlayback = false,
}: LazyXinpianchangPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(false);
  const enteredFullscreenRef = useRef(false);
  const fullscreenPlaybackRef = useRef(false);
  const startedRef = useRef(false);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
  playingRef.current = playing;

  const src = xinpianchangToEmbedUrl(embedUrl);
  const stayInline = inlinePlayback || autoPlay;

  const stopPlayback = useCallback(() => {
    if (!playingRef.current) return;
    enteredFullscreenRef.current = false;
    fullscreenPlaybackRef.current = false;
    setPlaying(false);
    setIframeLoaded(false);
    onStopRef.current?.();
  }, []);

  useEffect(() => {
    if (playing) setIframeLoaded(false);
  }, [playing]);

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

  const startPlayback = (options?: {syncFlush?: boolean}) => {
    if (startedRef.current) return;
    startedRef.current = true;

    trackVideoEvent({
      eventType: 'click_play',
      source: 'xinpianchang',
      videoId: extractXinpianchangMid(embedUrl) ?? undefined,
      portfolioEntryRef,
    });
    const wantsFullscreen = !stayInline && fullscreenOnPlay;
    if (wantsFullscreen) {
      fullscreenPlaybackRef.current = true;
    }

    if (options?.syncFlush === false) {
      setPlaying(true);
    } else {
      flushSync(() => setPlaying(true));
    }

    const wrap = wrapRef.current;
    if (wantsFullscreen && wrap) {
      requestElementFullscreen(wrap);
    }

    onPlay?.();
  };

  useLayoutEffect(() => {
    if (!autoPlay) return;
    startPlayback({syncFlush: false});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount autoplay
  }, [autoPlay]);

  const toggleFullscreen = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (getFullscreenElement() === wrap) {
      exitDocumentFullscreen();
      return;
    }
    requestElementFullscreen(wrap);
  };

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid Xinpianchang URL
      </div>
    );
  }

  const showFsLoading =
    playing && !stayInline && fullscreenOnPlay && !iframeLoaded;

  return (
    <div ref={wrapRef} className="relative aspect-video w-full bg-black">
      {playing ? (
        <iframe
          src={src}
          title="Video player"
          className="h-full w-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
          onLoad={() => setIframeLoaded(true)}
        />
      ) : (
        <button
          type="button"
          className="group absolute inset-0 block w-full cursor-pointer border-0 bg-black p-0"
          onClick={() => startPlayback()}
          aria-label="Play video"
        >
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={posterAlt}
              fill
              className="object-cover"
              sizes="(max-width: 992px) 100vw, 60vw"
            />
          ) : null}
          {!hidePlayButton ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/90 bg-black/40 transition duration-200 group-hover:scale-110 group-hover:border-white group-hover:bg-black/55">
                <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
              </span>
            </span>
          ) : null}
        </button>
      )}
      {playing && !showFsLoading ? (
        <button
          type="button"
          className="absolute bottom-3 right-3 z-[5] flex h-9 w-9 items-center justify-center border-0 bg-black/55 text-white"
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
          title="Fullscreen"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
            />
          </svg>
        </button>
      ) : null}
      {showFsLoading ? (
        <div
          className="absolute inset-0 z-[3] flex items-center justify-center bg-black"
          aria-hidden
        >
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      ) : null}
    </div>
  );
}
