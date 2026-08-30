'use client';

/**
 * LazyVimeoPlayer — custom poster until play; Vimeo iframe is preloaded underneath
 * so mobile play/unmute/fullscreen can run inside the same user-gesture turn.
 *
 * Why preload: iOS/Android drop the gesture if we only mount the iframe after
 * click (autoplay muted was the old workaround). Vimeo requires the iframe to
 * already be loaded before `play()` / `setMuted(false)` / `requestFullscreen()`
 * will honor a tap.
 *
 * Mobile (and carousel cards via `fullscreenOnPlay`): watch is fullscreen-only.
 * Exiting fullscreen stops playback and restores the poster (no inline hybrid).
 *
 * Carousel previews stay on their own muted path — not this component.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type Player from '@vimeo/player';
import { extractVimeoId, vimeoPlayerEmbedSrc } from '@/lib/vimeo';
import { normalizeStoredVideoUrl } from '@/lib/video-url';
import { trackVideoEvent } from '@/lib/video-events';

/** Poster `sizes` for case-study carousel cards (~85vw mobile / ~70vw desktop). */
export const CASE_CAROUSEL_POSTER_SIZES =
  '(max-width: 992px) 85vw, 70vw';

/** Poster `sizes` for full-width case video inside the 1680px content rail. */
export const CASE_VIDEO_POSTER_SIZES =
  '(max-width: 992px) 100vw, min(1680px, 100vw)';

/** Poster `sizes` for in-body video embeds (prose column). */
export const PROSE_VIDEO_POSTER_SIZES = '(max-width: 992px) 100vw, 900px';

interface LazyVimeoPlayerProps {
  vimeoUrl: string;
  posterUrl?: string;
  posterAlt?: string;
  /** Sanity portfolioEntry document id (weak ref on analytics write). */
  portfolioEntryRef?: string;
  /** Fires once when the user starts playback from the poster. */
  onPlay?: () => void;
  /** Fires when playback stops (mobile fullscreen exit, etc.). */
  onStop?: () => void;
  /** Hide the centered play glyph (poster remains clickable). */
  hidePlayButton?: boolean;
  /** Hint for responsive poster srcset width (must match rendered width). */
  posterSizes?: string;
  /** Eager-load poster when above the fold (LCP hero). */
  priority?: boolean;
  /** Carousel: open fullscreen on play; exit restores poster on all viewports. */
  fullscreenOnPlay?: boolean;
}

/** WP / GTM progress milestones — 0–100 scale (SDK `percent` is 0–1). */
const PROGRESS_MILESTONES = [25, 50, 75, 90, 100] as const;

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

function pushVimeoDataLayerEvent(
  event: 'CE - Vimeo play' | 'CE - Vimeo progress' | 'CE - Vimeo complete',
  vimeoVideoId: string,
  progressPercent: number,
): void {
  if (typeof window === 'undefined') return;

  const w = window as Window & { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({
    event,
    vimeo_video_id: vimeoVideoId,
    progress_percent: progressPercent,
  });
}

export function LazyVimeoPlayer({
  vimeoUrl,
  posterUrl,
  posterAlt = '',
  portfolioEntryRef,
  onPlay,
  onStop,
  hidePlayButton = false,
  posterSizes = CASE_VIDEO_POSTER_SIZES,
  priority = false,
  fullscreenOnPlay = false,
}: LazyVimeoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  /** null until client mount — avoids wrong playsinline on SSR/hydration. */
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const milestonesFiredRef = useRef(new Set<number>());
  const startedFromGestureRef = useRef(false);
  /** FS-on-play: only restore poster after we actually entered fullscreen once. */
  const enteredFullscreenRef = useRef(false);
  /** Set on play when this session should be fullscreen-only (mobile or carousel). */
  const fullscreenPlaybackRef = useRef(false);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;

  const normalizedUrl = normalizeStoredVideoUrl(vimeoUrl);
  const videoId = extractVimeoId(normalizedUrl);

  // No autoplay/muted in the URL — we call play() + setMuted(false) from the tap.
  const embedSrc =
    isMobile === null && !fullscreenOnPlay
      ? null
      : vimeoPlayerEmbedSrc(normalizedUrl, {
          playsinline: !(fullscreenOnPlay || isMobile),
          // Warm enough of the stream that play() from the poster tap is immediate.
          preload: 'auto',
        });

  useEffect(() => {
    setIsMobile(prefersMobileFullscreen());
  }, []);

  // Warm the SDK chunk early so the play tap does not wait on import.
  useEffect(() => {
    void import('@vimeo/player');
  }, []);

  const stopPlayback = useCallback(() => {
    if (!startedFromGestureRef.current) return;
    startedFromGestureRef.current = false;
    enteredFullscreenRef.current = false;
    fullscreenPlaybackRef.current = false;
    setPlaying(false);
    const player = playerRef.current;
    if (player) {
      void player.pause().catch(() => {});
    }
    onStopRef.current?.();
  }, []);

  // Attach SDK once the preloaded iframe is in the DOM.
  useEffect(() => {
    if (!embedSrc || !videoId) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    let cancelled = false;
    let player: Player | null = null;

    const onPlayEvent = () => {
      pushVimeoDataLayerEvent('CE - Vimeo play', videoId, 0);
      trackVideoEvent({
        eventType: 'view_start',
        source: 'vimeo',
        videoId,
        portfolioEntryRef,
      });
    };

    const onTimeUpdate = (data: { percent: number }) => {
      const progressPercent = Math.round(data.percent * 100);
      for (const milestone of PROGRESS_MILESTONES) {
        if (
          progressPercent >= milestone &&
          !milestonesFiredRef.current.has(milestone)
        ) {
          milestonesFiredRef.current.add(milestone);
          pushVimeoDataLayerEvent('CE - Vimeo progress', videoId, milestone);
          trackVideoEvent({
            eventType: 'milestone',
            milestonePercent: milestone,
            source: 'vimeo',
            videoId,
            portfolioEntryRef,
          });
        }
      }
    };

    const onEnded = () => {
      pushVimeoDataLayerEvent('CE - Vimeo complete', videoId, 100);
      trackVideoEvent({
        eventType: 'complete',
        source: 'vimeo',
        videoId,
        portfolioEntryRef,
      });
    };

    void (async () => {
      const { default: VimeoPlayer } = await import('@vimeo/player');
      if (cancelled || !iframeRef.current) return;

      player = new VimeoPlayer(iframeRef.current);
      if (cancelled) {
        void player.destroy();
        player = null;
        return;
      }

      playerRef.current = player;
      player.on('play', onPlayEvent);
      player.on('timeupdate', onTimeUpdate);
      player.on('ended', onEnded);

      try {
        await player.ready();
        if (!cancelled) setPlayerReady(true);
      } catch {
        // Still allow poster tap; startPlayback will no-op until ready.
      }
    })();

    return () => {
      cancelled = true;
      milestonesFiredRef.current.clear();
      setPlayerReady(false);
      playerRef.current = null;
      if (player) {
        player.off('play', onPlayEvent);
        player.off('timeupdate', onTimeUpdate);
        player.off('ended', onEnded);
        void player.destroy();
        player = null;
      }
    };
  }, [embedSrc, videoId, portfolioEntryRef]);

  // FS-on-play: exiting fullscreen returns to poster browse (no inline hybrid).
  useEffect(() => {
    if (!playing) return;

    const stopIfLeftFullscreen = () => {
      if (!fullscreenPlaybackRef.current) return;
      if (!enteredFullscreenRef.current) return;
      if (getFullscreenElement()) return;
      stopPlayback();
    };

    const onDocFsChange = () => {
      const fsEl = getFullscreenElement();
      if (fsEl) {
        enteredFullscreenRef.current = true;
        return;
      }
      stopIfLeftFullscreen();
    };

    document.addEventListener('fullscreenchange', onDocFsChange);
    document.addEventListener('webkitfullscreenchange', onDocFsChange);

    const player = playerRef.current;
    const onVimeoFs = (data: { fullscreen: boolean }) => {
      if (!fullscreenPlaybackRef.current) return;
      if (data.fullscreen) {
        enteredFullscreenRef.current = true;
        return;
      }
      if (!enteredFullscreenRef.current) return;
      stopPlayback();
    };
    if (player) {
      player.on('fullscreenchange', onVimeoFs);
    }

    return () => {
      document.removeEventListener('fullscreenchange', onDocFsChange);
      document.removeEventListener('webkitfullscreenchange', onDocFsChange);
      if (player) {
        player.off('fullscreenchange', onVimeoFs);
      }
    };
  }, [playing, playerReady, stopPlayback]);

  const startPlayback = () => {
    if (startedFromGestureRef.current) return;
    startedFromGestureRef.current = true;
    setPlaying(true);
    onPlay?.();

    const mobile = isMobile ?? prefersMobileFullscreen();
    const wantsFullscreen = fullscreenOnPlay || mobile;
    fullscreenPlaybackRef.current = wantsFullscreen;
    const wrap = wrapRef.current;
    const player = playerRef.current;

    // Element fullscreen must be kicked off synchronously in the gesture.
    // Complements Vimeo playsinline=0 / player.requestFullscreen().
    if (wantsFullscreen && wrap) {
      enteredFullscreenRef.current = true;
      requestElementFullscreen(wrap);
    }

    if (!player) {
      // Iframe still booting — ready() handler below cannot recover gesture;
      // retry play once player becomes ready (sound/FS may be limited).
      return;
    }

    // Do not await between these — awaiting yields and drops user activation.
    void player.setMuted(false);
    void player.setVolume(1);
    if (wantsFullscreen) {
      void player.requestFullscreen().catch(() => {});
    }
    void player.play().catch(() => {});
  };

  // If the user tapped before the SDK finished ready(), start as soon as it is.
  // Sound/fullscreen may still be blocked without a gesture — preload aims to
  // avoid this path on real devices.
  useEffect(() => {
    if (!playing || !playerReady || !startedFromGestureRef.current) return;
    const player = playerRef.current;
    if (!player) return;

    void (async () => {
      try {
        const paused = await player.getPaused();
        if (!paused) return;
        await player.setMuted(false);
        await player.setVolume(1);
        if (fullscreenPlaybackRef.current) {
          try {
            const fs = await player.getFullscreen();
            if (!fs) {
              await player.requestFullscreen();
            }
          } catch {
            // FS may be blocked; exit handler still applies if it opens later.
          }
        }
        await player.play();
      } catch {
        // Ignore — user can tap Vimeo controls.
      }
    })();
  }, [playing, playerReady]);

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid Vimeo URL
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="relative aspect-video w-full overflow-hidden bg-black"
    >
      {embedSrc ? (
        <iframe
          ref={iframeRef}
          src={embedSrc}
          title="Vimeo video"
          className={`absolute inset-0 h-full w-full border-0 ${
            playing ? 'z-[1] opacity-100' : 'z-0 opacity-0'
          }`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null}

      {!playing ? (
        <button
          type="button"
          className="group absolute inset-0 z-[2] block w-full cursor-pointer border-0 bg-black p-0"
          onClick={startPlayback}
          aria-label="Play video"
        >
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={posterAlt}
              fill
              className="object-cover"
              sizes={posterSizes}
              priority={priority}
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
      ) : null}
    </div>
  );
}
