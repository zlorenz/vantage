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
 * Carousel previews stay on their own muted path — not this component.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type Player from '@vimeo/player';
import { extractVimeoId, vimeoPlayerEmbedSrc } from '@/lib/vimeo';
import { normalizeStoredVideoUrl } from '@/lib/video-url';

interface LazyVimeoPlayerProps {
  vimeoUrl: string;
  posterUrl?: string;
  posterAlt?: string;
}

/** WP / GTM progress milestones — 0–100 scale (SDK `percent` is 0–1). */
const PROGRESS_MILESTONES = [25, 50, 75] as const;

/** Touch phones/tablets (and narrow viewports): expand to fullscreen on first play. */
function prefersMobileFullscreen(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
    window.matchMedia('(max-width: 767px)').matches
  );
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

  const normalizedUrl = normalizeStoredVideoUrl(vimeoUrl);
  const videoId = extractVimeoId(normalizedUrl);

  // No autoplay/muted in the URL — we call play() + setMuted(false) from the tap.
  const embedSrc =
    isMobile === null
      ? null
      : vimeoPlayerEmbedSrc(normalizedUrl, {
          playsinline: isMobile ? false : true,
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

  // Attach SDK once the preloaded iframe is in the DOM.
  useEffect(() => {
    if (!embedSrc || !videoId) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    let cancelled = false;
    let player: Player | null = null;

    const onPlay = () => {
      pushVimeoDataLayerEvent('CE - Vimeo play', videoId, 0);
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
        }
      }
    };

    const onEnded = () => {
      pushVimeoDataLayerEvent('CE - Vimeo complete', videoId, 100);
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
      player.on('play', onPlay);
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
        player.off('play', onPlay);
        player.off('timeupdate', onTimeUpdate);
        player.off('ended', onEnded);
        void player.destroy();
        player = null;
      }
    };
  }, [embedSrc, videoId]);

  const startPlayback = () => {
    if (startedFromGestureRef.current) return;
    startedFromGestureRef.current = true;
    setPlaying(true);

    const mobile = isMobile ?? prefersMobileFullscreen();
    const wrap = wrapRef.current;
    const player = playerRef.current;

    // Element fullscreen must be kicked off synchronously in the gesture.
    // Complements Vimeo playsinline=0 / player.requestFullscreen().
    if (mobile && wrap) {
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
    if (mobile) {
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
              sizes="100vw"
            />
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/90 bg-black/40 transition duration-200 group-hover:scale-110 group-hover:border-white group-hover:bg-black/55">
              <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
            </span>
          </span>
        </button>
      ) : null}
    </div>
  );
}
