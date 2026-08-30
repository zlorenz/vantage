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
import { flushSync } from 'react-dom';
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
  /** Hidden iframe warm-up for inactive carousel slides (no poster UI). */
  prefetch?: boolean;
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

function exitDocumentFullscreen(): void {
  const doc = document as Document & {
    webkitExitFullscreen?: () => void;
  };
  if (getFullscreenElement()) {
    void document.exitFullscreen?.().catch(() => {});
    doc.webkitExitFullscreen?.();
  }
}

async function exitVimeoFullscreen(player: Player): Promise<void> {
  try {
    if (await player.getFullscreen()) {
      await player.exitFullscreen();
    }
  } catch {
    // Ignore — player may already be inline.
  }
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
  prefetch = false,
}: LazyVimeoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  /** null until client mount — avoids wrong playsinline on SSR/hydration. */
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  /** SDK was not ready on first tap — need a fresh gesture to play. */
  const [awaitingTapToPlay, setAwaitingTapToPlay] = useState(false);
  const awaitingTapToPlayRef = useRef(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const milestonesFiredRef = useRef(new Set<number>());
  const startedFromGestureRef = useRef(false);
  /** FS-on-play: only restore poster after we actually entered fullscreen once. */
  const enteredFullscreenRef = useRef(false);
  /** Set on play when this session should be fullscreen-only (mobile or carousel). */
  const fullscreenPlaybackRef = useRef(false);
  /** Tap started playback before the Vimeo SDK was ready — show tap-to-play. */
  const pendingStartRef = useRef(false);
  /** Whether player.ready() was true at poster-tap time. */
  const playerReadyAtTapRef = useRef(false);
  const playbackWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    awaitingTapToPlayRef.current = awaitingTapToPlay;
  }, [awaitingTapToPlay]);

  useEffect(() => {
    setIsMobile(prefersMobileFullscreen());
  }, []);

  // Warm the SDK chunk early so the play tap does not wait on import.
  useEffect(() => {
    void import('@vimeo/player');
  }, []);

  const clearPlaybackWatchdog = useCallback(() => {
    if (playbackWatchdogRef.current) {
      clearTimeout(playbackWatchdogRef.current);
      playbackWatchdogRef.current = null;
    }
  }, []);

  const resetToPoster = useCallback(() => {
    clearPlaybackWatchdog();
    startedFromGestureRef.current = false;
    enteredFullscreenRef.current = false;
    fullscreenPlaybackRef.current = false;
    pendingStartRef.current = false;
    playerReadyAtTapRef.current = false;
    awaitingTapToPlayRef.current = false;
    setAwaitingTapToPlay(false);
    setPlaying(false);
    const player = playerRef.current;
    if (player) {
      void exitVimeoFullscreen(player).finally(() => {
        void player.pause().catch(() => {});
      });
    }
    exitDocumentFullscreen();
    onStopRef.current?.();
  }, [clearPlaybackWatchdog]);

  /** Keep session alive but ask for a fresh tap — do not call onStop. */
  const promptTapToPlay = useCallback(() => {
    clearPlaybackWatchdog();
    pendingStartRef.current = false;
    awaitingTapToPlayRef.current = true;
    setAwaitingTapToPlay(true);
    // Stay in playing/FS session so carousel + iframe remain active.
    setPlaying(true);
  }, [clearPlaybackWatchdog]);

  const stopPlayback = useCallback(() => {
    if (!startedFromGestureRef.current && !playing) return;
    resetToPoster();
  }, [playing, resetToPoster]);

  // Inactive carousel slides switch to prefetch — stop any in-flight session.
  useEffect(() => {
    if (!prefetch) return;
    if (playing || startedFromGestureRef.current || awaitingTapToPlay) {
      resetToPoster();
    }
  }, [prefetch, playing, awaitingTapToPlay, resetToPoster]);

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
      // We exit Vimeo FS on purpose to show our tap-to-play overlay.
      if (awaitingTapToPlayRef.current) return;
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

  useEffect(() => clearPlaybackWatchdog, [clearPlaybackWatchdog]);

  const attemptPlayback = useCallback(
    async (player: Player, wantsFullscreen: boolean) => {
      clearPlaybackWatchdog();
      const wrap = wrapRef.current;

      try {
        // Keep FS + play in one gesture — awaiting requestFullscreen before
        // play() drops iOS user activation and leaves Vimeo paused in FS.
        void player.setMuted(false);
        void player.setVolume(1);
        if (wantsFullscreen) {
          void player.requestFullscreen().catch(() => {});
        }
        await player.play();

        pendingStartRef.current = false;
        awaitingTapToPlayRef.current = false;
        setAwaitingTapToPlay(false);

        // Only prompt for a second tap if still paused after buffer time.
        playbackWatchdogRef.current = setTimeout(() => {
          void (async () => {
            if (!startedFromGestureRef.current || awaitingTapToPlayRef.current) {
              return;
            }
            try {
              if (!(await player.getPaused())) return;
              const time = await player.getCurrentTime();
              if (time > 0.1) return;

              await exitVimeoFullscreen(player);
              if (fullscreenPlaybackRef.current && wrapRef.current) {
                requestElementFullscreen(wrapRef.current);
              }
              promptTapToPlay();
            } catch {
              // Ignore — user can exit FS manually.
            }
          })();
        }, 1500);
      } catch {
        if (wantsFullscreen && wrap) {
          requestElementFullscreen(wrap);
        }
        promptTapToPlay();
      }
    },
    [clearPlaybackWatchdog, promptTapToPlay],
  );

  const startPlayback = () => {
    if (startedFromGestureRef.current) return;
    startedFromGestureRef.current = true;
    setAwaitingTapToPlay(false);

    const mobile = isMobile ?? prefersMobileFullscreen();
    const wantsFullscreen = fullscreenOnPlay || mobile;
    fullscreenPlaybackRef.current = wantsFullscreen;
    const wrap = wrapRef.current;
    const player = playerRef.current;
    const readyNow = playerReady && !!player;
    playerReadyAtTapRef.current = readyNow;

    flushSync(() => setPlaying(true));

    if (wantsFullscreen && wrap) {
      requestElementFullscreen(wrap);
    }

    onPlay?.();

    if (readyNow) {
      pendingStartRef.current = false;
      void attemptPlayback(player!, wantsFullscreen);
    } else {
      pendingStartRef.current = true;
    }
  };

  /** Second tap when SDK finished loading after the first gesture expired. */
  const confirmTapToPlay = () => {
    const player = playerRef.current;
    if (!player || !playerReady) return;

    awaitingTapToPlayRef.current = false;
    setAwaitingTapToPlay(false);

    const wantsFullscreen = fullscreenPlaybackRef.current;
    const wrap = wrapRef.current;
    if (wantsFullscreen && wrap) {
      requestElementFullscreen(wrap);
    }

    void attemptPlayback(player, wantsFullscreen);
  };

  // SDK became ready after poster tap — ask for a fresh gesture instead of
  // auto-playing (iOS blocks play/FS without user activation).
  useEffect(() => {
    if (!playing || !playerReady || !pendingStartRef.current) return;
    if (playerReadyAtTapRef.current) return;

    pendingStartRef.current = false;
    setAwaitingTapToPlay(true);
  }, [playing, playerReady]);

  const wantsFsSession = fullscreenOnPlay || isMobile === true;
  const showFsLoading = playing && wantsFsSession && !playerReady && !awaitingTapToPlay;
  const showTapToPlay = playing && awaitingTapToPlay && playerReady;

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid Vimeo URL
      </div>
    );
  }

  if (prefetch) {
    return (
      <div
        ref={wrapRef}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0"
        aria-hidden
      >
        {embedSrc ? (
          <iframe
            ref={iframeRef}
            src={embedSrc}
            title=""
            tabIndex={-1}
            className="absolute inset-0 h-full w-full border-0 opacity-0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : null}
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

      {showFsLoading ? (
        <div
          className="absolute inset-0 z-[3] flex items-center justify-center bg-black"
          aria-hidden
        >
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      ) : null}

      {showTapToPlay ? (
        <button
          type="button"
          className="absolute inset-0 z-[4] flex items-center justify-center border-0 bg-black/90 p-4 text-center text-white"
          onClick={confirmTapToPlay}
          aria-label="Tap to play video"
        >
          <span className="flex flex-col items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/90 bg-white/10">
              <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
            </span>
            <span className="font-sans text-sm tracking-wide text-white/90">
              Tap to play
            </span>
          </span>
        </button>
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
