'use client';

/**
 * LazyYouTubePlayer — YouTube poster until play; then loads embed iframe.
 */

import { useState } from 'react';
import Image from 'next/image';
import { youTubePosterUrl } from '@/lib/youtube';

interface LazyYouTubePlayerProps {
  videoId: string;
  title?: string;
}

/** Touch phones/tablets (and narrow viewports): expand to fullscreen on first play. */
function prefersMobileFullscreen(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
    window.matchMedia('(max-width: 767px)').matches
  );
}

export function LazyYouTubePlayer({ videoId, title = 'YouTube video' }: LazyYouTubePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [mobileFullscreen, setMobileFullscreen] = useState(false);
  const [posterSrc, setPosterSrc] = useState(youTubePosterUrl(videoId, 'maxres'));

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid YouTube URL
      </div>
    );
  }

  if (playing) {
    const params = new URLSearchParams({ autoplay: '1' });
    // iOS: playsinline=0 enters native fullscreen when playback starts.
    if (mobileFullscreen) params.set('playsinline', '0');

    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
          title={title}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="group relative block aspect-video w-full cursor-pointer border-0 bg-black p-0"
      onClick={() => {
        setMobileFullscreen(prefersMobileFullscreen());
        setPlaying(true);
      }}
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
      <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/90 bg-black/40">
          <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
        </span>
      </span>
    </button>
  );
}
