'use client';

/**
 * LazyXinpianchangPlayer — poster until play; then loads validated embed iframe.
 */

import { useState } from 'react';
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
  /** Fires when playback stops (parent remount / carousel drag-catcher). */
  onStop?: () => void;
  /** Hide the centered play glyph (poster remains clickable). */
  hidePlayButton?: boolean;
}

export function LazyXinpianchangPlayer({
  embedUrl,
  posterUrl,
  posterAlt = '',
  portfolioEntryRef,
  onPlay,
  hidePlayButton = false,
}: LazyXinpianchangPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const src = xinpianchangToEmbedUrl(embedUrl);

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid Xinpianchang URL
      </div>
    );
  }

  if (!playing) {
    return (
      <button
        type="button"
        className="group relative block aspect-video w-full cursor-pointer border-0 bg-black p-0"
        onClick={() => {
          trackVideoEvent({
            eventType: 'click_play',
            source: 'xinpianchang',
            videoId: extractXinpianchangMid(embedUrl) ?? undefined,
            portfolioEntryRef,
          });
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
    );
  }

  return (
    <iframe
      src={src}
      title="Video player"
      className="aspect-video w-full border-0"
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  );
}
