'use client';

/**
 * LazyVimeoPlayer — poster thumbnail until play; then loads a Vimeo iframe.
 *
 * Uses player.vimeo.com iframe (same pattern as LazyYouTubePlayer) instead of
 * `@vimeo/player`, which throws "error fetching the embed code from Vimeo"
 * when oEmbed is blocked (localhost, domain allowlists, some privacy settings).
 */

import { useState } from 'react';
import Image from 'next/image';
import { extractVimeoId, vimeoPlayerEmbedSrc } from '@/lib/vimeo';
import { normalizeStoredVideoUrl } from '@/lib/video-url';

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

  const normalizedUrl = normalizeStoredVideoUrl(vimeoUrl);
  const videoId = extractVimeoId(normalizedUrl);
  const embedSrc = vimeoPlayerEmbedSrc(normalizedUrl, { autoplay: true });

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
