'use client';

/**
 * LazyYouTubePlayer — custom poster until play. The embed iframe is warmed
 * underneath so unmute / play / fullscreen can run in the same tap.
 *
 * Why preload: iOS and Android drop the user gesture if the iframe is created
 * after the click. The IFrame API script also misses `onReady` when it wraps
 * an iframe that has already loaded, which left the poster on a spinner.
 * Commands go straight to the warmed frame via postMessage instead.
 *
 * Mobile (and carousel cards via `fullscreenOnPlay`): watch is fullscreen-only.
 * Exiting fullscreen — our element, or the iOS native player — stops playback
 * and restores the poster. Desktop without `fullscreenOnPlay` stays inline.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import { youTubePosterUrl } from '@/lib/youtube';
import { trackVideoEvent } from '@/lib/video-events';
import { MinimalVideoChrome } from '@/components/ui/MinimalVideoChrome';
import './lazy-youtube-player.css';

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
  /** Hidden iframe warm-up for inactive carousel slides (no poster UI). */
  prefetch?: boolean;
}

/** YT.PlayerState — numeric so we don't depend on the iframe API script. */
const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;

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
  if (!getFullscreenElement()) return;
  void document.exitFullscreen?.().catch(() => {});
  doc.webkitExitFullscreen?.();
}

function youTubeEmbedSrc(
  videoId: string,
  playsInline: boolean,
  origin: string,
  frameId: string,
): string {
  const params = new URLSearchParams({
    enablejsapi: '1',
    origin,
    playsinline: playsInline ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    controls: '0',
    fs: '0',
    widgetid: frameId,
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

function postToFrame(
  iframe: HTMLIFrameElement,
  frameId: string,
  payload: Record<string, unknown>,
): void {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ ...payload, id: frameId, channel: 'widget' }),
    'https://www.youtube.com',
  );
}

function commandFrame(
  iframe: HTMLIFrameElement,
  frameId: string,
  func: string,
  args: unknown[] = [],
): void {
  postToFrame(iframe, frameId, { event: 'command', func, args });
}

export function LazyYouTubePlayer({
  videoId,
  title = 'YouTube video',
  portfolioEntryRef,
  onPlay,
  onStop,
  hidePlayButton = false,
  fullscreenOnPlay = false,
  prefetch = false,
}: LazyYouTubePlayerProps) {
  const [playing, setPlaying] = useState(false);
  /** null until client mount — playsinline must match the real viewport. */
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [awaitingTapToPlay, setAwaitingTapToPlay] = useState(false);
  const [posterSrc, setPosterSrc] = useState(() =>
    youTubePosterUrl(videoId, 'maxres'),
  );
  /** Set on mount so the embed URL matches SSR (null) through hydration. */
  const [origin, setOrigin] = useState<string | null>(null);
  const [clock, setClock] = useState({
    current: 0,
    duration: 0,
    running: false,
  });

  const frameId = `vp-yt-${useId().replace(/:/g, '')}`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playingRef = useRef(false);
  const awaitingTapToPlayRef = useRef(false);
  const startedFromGestureRef = useRef(false);
  const enteredFullscreenRef = useRef(false);
  const fullscreenPlaybackRef = useRef(false);
  const pendingStartRef = useRef(false);
  const playerReadyAtTapRef = useRef(false);
  const playerReadyRef = useRef(false);
  const hasPlayedRef = useRef(false);
  const viewStartFiredRef = useRef(false);
  const completeFiredRef = useRef(false);
  const stoppingRef = useRef(false);
  const playerStateRef = useRef<number | null>(null);
  const playbackWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
  playingRef.current = playing;
  playerReadyRef.current = playerReady;

  const wantsInline = !(fullscreenOnPlay || isMobile === true);
  const embedSrc =
    !origin || (isMobile === null && !fullscreenOnPlay)
      ? null
      : youTubeEmbedSrc(videoId, wantsInline, origin, frameId);

  useEffect(() => {
    setPosterSrc(youTubePosterUrl(videoId, 'maxres'));
  }, [videoId]);

  useEffect(() => {
    awaitingTapToPlayRef.current = awaitingTapToPlay;
  }, [awaitingTapToPlay]);

  useEffect(() => {
    setIsMobile(prefersMobileFullscreen());
    setOrigin(window.location.origin);
  }, []);

  const clearPlaybackWatchdog = useCallback(() => {
    if (playbackWatchdogRef.current) {
      clearTimeout(playbackWatchdogRef.current);
      playbackWatchdogRef.current = null;
    }
  }, []);

  const resetToPoster = useCallback(() => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    clearPlaybackWatchdog();
    startedFromGestureRef.current = false;
    enteredFullscreenRef.current = false;
    fullscreenPlaybackRef.current = false;
    pendingStartRef.current = false;
    playerReadyAtTapRef.current = false;
    awaitingTapToPlayRef.current = false;
    hasPlayedRef.current = false;
    viewStartFiredRef.current = false;
    playerStateRef.current = null;
    setClock({current: 0, duration: 0, running: false});
    setAwaitingTapToPlay(false);
    setPlaying(false);
    const iframe = iframeRef.current;
    if (iframe) commandFrame(iframe, frameId, 'stopVideo');
    exitDocumentFullscreen();
    stoppingRef.current = false;
    onStopRef.current?.();
  }, [clearPlaybackWatchdog, frameId]);

  const promptTapToPlay = useCallback(() => {
    clearPlaybackWatchdog();
    pendingStartRef.current = false;
    awaitingTapToPlayRef.current = true;
    setAwaitingTapToPlay(true);
    setPlaying(true);
  }, [clearPlaybackWatchdog]);

  const stopPlayback = useCallback(() => {
    if (!startedFromGestureRef.current && !playingRef.current) return;
    resetToPoster();
  }, [resetToPoster]);

  const handlePlayerState = useCallback(
    (state: number) => {
      if (stoppingRef.current) return;
      playerStateRef.current = state;

      if (state === YT_PLAYING) {
        hasPlayedRef.current = true;
        setClock((clock) => ({...clock, running: true}));
        if (!viewStartFiredRef.current) {
          viewStartFiredRef.current = true;
          trackVideoEvent({
            eventType: 'view_start',
            source: 'youtube',
            videoId,
            portfolioEntryRef,
          });
        }
        return;
      }

      if (state === YT_ENDED && !completeFiredRef.current) {
        completeFiredRef.current = true;
        setClock((clock) => ({...clock, running: false}));
        trackVideoEvent({
          eventType: 'complete',
          source: 'youtube',
          videoId,
          portfolioEntryRef,
        });
      }

      if (state === YT_PAUSED) {
        setClock((clock) => ({...clock, running: false}));
      }

      // iOS dismisses its native player without a document fullscreenchange.
      // Element fullscreen stays active while the user pauses, so this only
      // runs once they have left that session.
      if (
        (state === YT_PAUSED || state === YT_ENDED) &&
        fullscreenPlaybackRef.current &&
        hasPlayedRef.current &&
        !awaitingTapToPlayRef.current &&
        !getFullscreenElement()
      ) {
        stopPlayback();
      }
    },
    [portfolioEntryRef, stopPlayback, videoId],
  );

  useEffect(() => {
    if (!prefetch) return;
    if (playing || startedFromGestureRef.current || awaitingTapToPlay) {
      resetToPoster();
    }
  }, [prefetch, playing, awaitingTapToPlay, resetToPoster]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!embedSrc || !iframe) return;

    let ready = false;
    const markReady = () => {
      if (ready) return;
      ready = true;
      if (poll) window.clearInterval(poll);
      setPlayerReady(true);
    };
    const announce = () => {
      postToFrame(iframe, frameId, { event: 'listening' });
    };
    let poll = window.setInterval(announce, 250);

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      let data: {
        event?: string;
        id?: string | number;
        info?:
          | number
          | {playerState?: number; currentTime?: number; duration?: number};
      };
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!data?.event) return;
      if (data.id != null && String(data.id) !== frameId) return;

      if (
        data.event === 'onReady' ||
        data.event === 'initialDelivery' ||
        data.event === 'readyToListen' ||
        data.event === 'alreadyInitialized'
      ) {
        markReady();
      }

      if (data.event === 'onStateChange' && typeof data.info === 'number') {
        handlePlayerState(data.info);
      }

      if (
        data.event === 'infoDelivery' &&
        data.info &&
        typeof data.info === 'object'
      ) {
        const info = data.info;
        if (typeof info.playerState === 'number') {
          handlePlayerState(info.playerState);
        }
        if (
          typeof info.currentTime === 'number' ||
          typeof info.duration === 'number' ||
          typeof info.playerState === 'number'
        ) {
          setClock((clock) => ({
            current:
              typeof info.currentTime === 'number'
                ? info.currentTime
                : clock.current,
            duration:
              typeof info.duration === 'number' ? info.duration : clock.duration,
            running:
              info.playerState === YT_PLAYING
                ? true
                : info.playerState === YT_PAUSED || info.playerState === YT_ENDED
                  ? false
                  : clock.running,
          }));
        }
      }
    };

    window.addEventListener('message', onMessage);
    iframe.addEventListener('load', announce);
    announce();

    return () => {
      ready = false;
      window.clearInterval(poll);
      setPlayerReady(false);
      window.removeEventListener('message', onMessage);
      iframe.removeEventListener('load', announce);
    };
  }, [embedSrc, frameId, handlePlayerState]);

  useEffect(() => {
    if (!playing) return;

    const onDocFsChange = () => {
      if (!fullscreenPlaybackRef.current) return;
      if (getFullscreenElement()) {
        enteredFullscreenRef.current = true;
        return;
      }
      if (!enteredFullscreenRef.current) return;
      if (awaitingTapToPlayRef.current) return;
      stopPlayback();
    };

    document.addEventListener('fullscreenchange', onDocFsChange);
    document.addEventListener('webkitfullscreenchange', onDocFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onDocFsChange);
      document.removeEventListener('webkitfullscreenchange', onDocFsChange);
    };
  }, [playing, stopPlayback]);

  useEffect(() => clearPlaybackWatchdog, [clearPlaybackWatchdog]);

  const attemptPlayback = useCallback(
    (wantsFullscreen: boolean) => {
      const iframe = iframeRef.current;
      const wrap = wrapRef.current;
      if (!iframe) {
        promptTapToPlay();
        return;
      }

      clearPlaybackWatchdog();

      // Don't await fullscreen before play — that drops iOS activation
      // and leaves the player paused in (or out of) fullscreen.
      commandFrame(iframe, frameId, 'unMute');
      commandFrame(iframe, frameId, 'setVolume', [100]);
      if (wantsFullscreen && wrap) {
        requestElementFullscreen(wrap);
      }
      commandFrame(iframe, frameId, 'playVideo');

      pendingStartRef.current = false;
      awaitingTapToPlayRef.current = false;
      setAwaitingTapToPlay(false);

      playbackWatchdogRef.current = setTimeout(() => {
        if (!startedFromGestureRef.current || awaitingTapToPlayRef.current) {
          return;
        }
        const state = playerStateRef.current;
        if (state === YT_PLAYING || state === YT_BUFFERING) return;
        if (hasPlayedRef.current) return;
        promptTapToPlay();
      }, 1500);
    },
    [clearPlaybackWatchdog, frameId, promptTapToPlay],
  );

  const startPlayback = () => {
    if (startedFromGestureRef.current) return;
    startedFromGestureRef.current = true;
    setAwaitingTapToPlay(false);

    trackVideoEvent({
      eventType: 'click_play',
      source: 'youtube',
      videoId,
      portfolioEntryRef,
    });

    const mobile = isMobile ?? prefersMobileFullscreen();
    const wantsFullscreen = fullscreenOnPlay || mobile;
    fullscreenPlaybackRef.current = wantsFullscreen;
    const wrap = wrapRef.current;
    const readyNow = playerReadyRef.current;
    playerReadyAtTapRef.current = readyNow;

    flushSync(() => setPlaying(true));

    if (wantsFullscreen && wrap) {
      requestElementFullscreen(wrap);
    }

    onPlay?.();

    if (readyNow) {
      pendingStartRef.current = false;
      attemptPlayback(wantsFullscreen);
    } else {
      pendingStartRef.current = true;
    }
  };

  const confirmTapToPlay = () => {
    if (!playerReadyRef.current) return;
    awaitingTapToPlayRef.current = false;
    setAwaitingTapToPlay(false);
    attemptPlayback(fullscreenPlaybackRef.current);
  };

  // Player became ready after the poster tap — ask for a fresh gesture.
  useEffect(() => {
    if (!playing || !playerReady || !pendingStartRef.current) return;
    if (playerReadyAtTapRef.current) return;
    pendingStartRef.current = false;
    setAwaitingTapToPlay(true);
  }, [playing, playerReady]);

  const wantsFsSession = fullscreenOnPlay || isMobile === true;
  const showFsLoading =
    playing && wantsFsSession && !playerReady && !awaitingTapToPlay;
  const showTapToPlay = playing && awaitingTapToPlay && playerReady;

  const frame = embedSrc ? (
    <iframe
      id={frameId}
      ref={iframeRef}
      src={embedSrc}
      title={prefetch ? '' : title}
      tabIndex={prefetch ? -1 : undefined}
      className="h-full w-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  ) : null;

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid YouTube URL
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={
        prefetch
          ? 'vp-lazy-youtube pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0'
          : 'vp-lazy-youtube relative aspect-video w-full overflow-hidden bg-black'
      }
      aria-hidden={prefetch || undefined}
    >
      {frame ? (
        <div
          className={`absolute inset-0 ${
            !prefetch && playing && !awaitingTapToPlay
              ? 'z-[1] opacity-100'
              : 'pointer-events-none z-0 opacity-0'
          }`}
        >
          {frame}
        </div>
      ) : null}

      {!prefetch && showFsLoading ? (
        <div
          className="absolute inset-0 z-[3] flex items-center justify-center bg-black"
          aria-hidden
        >
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      ) : null}

      {!prefetch && showTapToPlay ? (
        <button
          type="button"
          className="absolute inset-0 z-[4] flex items-center justify-center border-0 bg-black/90 p-4 text-center text-white"
          onClick={confirmTapToPlay}
          aria-label="Tap to play video"
        >
          <span className="flex flex-col items-center gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-none border-[1.5px] border-white/15 bg-white/5 backdrop-blur-[5px]">
              <span className="ml-0.5 block size-0 border-y-[0.75rem] border-l-[1.25rem] border-y-transparent border-l-white" />
            </span>
            <span className="font-sans text-sm tracking-wide text-white/90">
              Tap to play
            </span>
          </span>
        </button>
      ) : null}

      {!prefetch && playing && !awaitingTapToPlay ? (
        <MinimalVideoChrome
          running={clock.running}
          currentTime={clock.current}
          duration={clock.duration}
          onToggle={() => {
            const iframe = iframeRef.current;
            if (!iframe) return;
            commandFrame(
              iframe,
              frameId,
              clock.running ? 'pauseVideo' : 'playVideo',
            );
          }}
          onSeek={(seconds) => {
            const iframe = iframeRef.current;
            if (!iframe) return;
            commandFrame(iframe, frameId, 'seekTo', [seconds, true]);
            setClock((clock) => ({...clock, current: seconds}));
          }}
        />
      ) : null}

      {!prefetch && !playing ? (
        <button
          type="button"
          className="group absolute inset-0 z-[2] block w-full cursor-pointer border-0 bg-black p-0"
          onClick={startPlayback}
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
              <span className="flex h-20 w-20 items-center justify-center rounded-none border-[1.5px] border-white/15 bg-white/5 backdrop-blur-[5px] transition-colors duration-vp-default group-hover:bg-white/10">
                <span className="ml-0.5 block size-0 border-y-[0.75rem] border-l-[1.25rem] border-y-transparent border-l-white" />
              </span>
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
