'use client';

/**
 * LazyVimeoPlayer — poster thumbnail until play; then loads a Vimeo iframe.
 *
 * Uses a static player.vimeo.com iframe (same pattern as LazyYouTubePlayer).
 * After the iframe mounts, dynamically imports `@vimeo/player` and attaches to
 * the existing iframe for GTM dataLayer play/progress/complete events.
 * Creating embeds via the SDK is avoided — its oEmbed fetch fails when blocked
 * (localhost, domain allowlists, some privacy settings).
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const milestonesFiredRef = useRef(new Set<number>());

  const normalizedUrl = normalizeStoredVideoUrl(vimeoUrl);
  const videoId = extractVimeoId(normalizedUrl);
  const embedSrc = vimeoPlayerEmbedSrc(normalizedUrl, { autoplay: true });

  useEffect(() => {
    if (!playing || !videoId) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    let cancelled = false;
    let player: Player | null = null;

    const onPlay = () => {
      pushVimeoDataLayerEvent('CE - Vimeo play', videoId, 0);
    };

    const onTimeUpdate = (data: { percent: number }) => {
      // SDK ProportionPercent is 0–1; live GTM / WP used 0–100 (25/50/75/100).
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

      player.on('play', onPlay);
      player.on('timeupdate', onTimeUpdate);
      player.on('ended', onEnded);
    })();

    return () => {
      cancelled = true;
      milestonesFiredRef.current.clear();
      if (player) {
        player.off('play', onPlay);
        player.off('timeupdate', onTimeUpdate);
        player.off('ended', onEnded);
        void player.destroy();
        player = null;
      }
    };
  }, [playing, videoId]);

  if (!videoId || !embedSrc) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid Vimeo URL
      </div>
    );
  }

  if (playing) {
    return (
      <div className="relative aspect-video w-full bg-black">
        <iframe
          ref={iframeRef}
          src={embedSrc}
          title="Vimeo video"
          className="h-full w-full border-0"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="group relative block aspect-video w-full cursor-pointer border-0 bg-black p-0"
      onClick={() => setPlaying(true)}
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
      <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/90 bg-black/40">
          <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
        </span>
      </span>
    </button>
  );
}
