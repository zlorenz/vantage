'use client';

/**
 * LazyXinpianchangPlayer — poster until play; then loads validated embed iframe.
 *
 * Carousel cards (`fullscreenOnPlay`): element fullscreen on play; exit restores
 * the poster.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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

export function LazyXinpianchangPlayer({
  embedUrl,
  posterUrl,
  posterAlt = '',
  portfolioEntryRef,
  onPlay,
  onStop,
  hidePlayButton = false,
  fullscreenOnPlay = false,
}: LazyXinpianchangPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(false);
  const enteredFullscreenRef = useRef(false);
  const fullscreenPlaybackRef = useRef(false);
  const pendingElementFsRef = useRef(false);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
  playingRef.current = playing;

  const src = xinpianchangToEmbedUrl(embedUrl);

  const stopPlayback = useCallback(() => {
    if (!playingRef.current) return;
    enteredFullscreenRef.current = false;
    fullscreenPlaybackRef.current = false;
    pendingElementFsRef.current = false;
    setPlaying(false);
    onStopRef.current?.();
  }, []);

  useEffect(() => {
    if (!playing || !pendingElementFsRef.current) return;
    pendingElementFsRef.current = false;
    const wrap = wrapRef.current;
    if (!wrap) return;
    enteredFullscreenRef.current = true;
    requestElementFullscreen(wrap);
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

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid Xinpianchang URL
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative aspect-video w-full bg-black">
      {playing ? (
        <iframe
          src={src}
          title="Video player"
          className="h-full w-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="group absolute inset-0 block w-full cursor-pointer border-0 bg-black p-0"
          onClick={() => {
            trackVideoEvent({
              eventType: 'click_play',
              source: 'xinpianchang',
              videoId: extractXinpianchangMid(embedUrl) ?? undefined,
              portfolioEntryRef,
            });
            if (fullscreenOnPlay) {
              fullscreenPlaybackRef.current = true;
              pendingElementFsRef.current = true;
            }
            setPlaying(true);
            onPlay?.();
          }}
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
    </div>
  );
}
