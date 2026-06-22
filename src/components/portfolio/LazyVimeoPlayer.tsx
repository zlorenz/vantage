'use client';

/**
 * LazyVimeoPlayer — poster thumbnail until play; then loads @vimeo/player SDK.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { extractVimeoId } from '@/lib/vimeo';

interface LazyVimeoPlayerProps {
  vimeoUrl: string;
  posterUrl?: string;
  posterAlt?: string;
}

export function LazyVimeoPlayer({
  vimeoUrl,
  posterUrl,
  posterAlt = '',
}: LazyVimeoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoId = extractVimeoId(vimeoUrl);

  useEffect(() => {
    if (!playing || !containerRef.current || !videoId) return;

    let player: { destroy: () => Promise<void> } | undefined;

    void import('@vimeo/player').then(({ default: Player }) => {
      if (!containerRef.current) return;
      player = new Player(containerRef.current, {
        id: Number(videoId),
        responsive: true,
      });
    });

    return () => {
      void player?.destroy();
    };
  }, [playing, videoId]);

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid Vimeo URL
      </div>
    );
  }

  if (!playing) {
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
            sizes="(max-width: 992px) 100vw, 60vw"
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

  return <div ref={containerRef} className="aspect-video w-full bg-black" />;
}
