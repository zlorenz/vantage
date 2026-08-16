'use client';

/**
 * Prototype Vimeo layer — mount only inside the 3-item window.
 * Outside the window the iframe is unmounted (torn down), not paused.
 */

import { useEffect, useRef } from 'react';
import type Player from '@vimeo/player';
import { extractVimeoId, extractVimeoPrivacyHash } from '@/lib/vimeo';
import { normalizeStoredVideoUrl } from '@/lib/video-url';

interface CarouselVimeoProps {
  vimeoUrl: string;
  active: boolean;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
}

function prototypeVimeoSrc(url: string): string | null {
  const id = extractVimeoId(url);
  if (!id) return null;

  const params = new URLSearchParams({
    muted: '1',
    loop: '1',
    background: '1',
    autopause: '0',
    playsinline: '1',
    autoplay: '1',
  });

  const hash = extractVimeoPrivacyHash(url);
  if (hash) params.set('h', hash);

  return `https://player.vimeo.com/video/${id}?${params}`;
}

export function CarouselVimeo({
  vimeoUrl,
  active,
  previewStartSeconds,
  previewEndSeconds,
}: CarouselVimeoProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const activeRef = useRef(active);
  const startRef = useRef(previewStartSeconds);
  const endRef = useRef(previewEndSeconds);

  const normalizedUrl = normalizeStoredVideoUrl(vimeoUrl);
  const embedSrc = prototypeVimeoSrc(normalizedUrl);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    startRef.current = previewStartSeconds;
    endRef.current = previewEndSeconds;
  }, [previewStartSeconds, previewEndSeconds]);

  useEffect(() => {
    if (!embedSrc) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    let cancelled = false;

    void (async () => {
      const { default: VimeoPlayer } = await import('@vimeo/player');
      if (cancelled || !iframeRef.current) return;

      const player = new VimeoPlayer(iframeRef.current);
      playerRef.current = player;

      const onTimeUpdate = (data: {seconds: number}) => {
        const end = endRef.current;
        if (end == null || !activeRef.current) return;
        if (data.seconds >= end) {
          void player.setCurrentTime(startRef.current ?? 0);
        }
      };

      try {
        await player.setVolume(0);
        const boundedLoop = endRef.current != null;
        await player.setLoop(!boundedLoop);
        if (boundedLoop) {
          player.on('timeupdate', onTimeUpdate);
        }
        if (cancelled) return;
        if (activeRef.current) {
          if (startRef.current != null) {
            await player.setCurrentTime(startRef.current);
          }
          await player.play();
        } else {
          await player.pause();
        }
      } catch {
        // Autoplay can be blocked until the first gesture; swipe is enough.
      }
    })();

    return () => {
      cancelled = true;
      const player = playerRef.current;
      playerRef.current = null;
      if (player) void player.destroy();
    };
  }, [embedSrc]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (active) {
      void (async () => {
        try {
          await player.setVolume(0);
          if (startRef.current != null) {
            await player.setCurrentTime(startRef.current);
          }
          await player.play();
        } catch {
          // Autoplay can be blocked until the first gesture.
        }
      })();
    } else {
      void player.pause();
    }
  }, [active]);

  if (!embedSrc) return null;

  return (
    <div className="vp-proto-carousel__player" aria-hidden>
      <iframe
        ref={iframeRef}
        src={embedSrc}
        title="Featured work video"
        className="vp-proto-carousel__iframe"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
        tabIndex={-1}
      />
    </div>
  );
}
