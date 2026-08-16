'use client';

/**
 * Native muted preview for a carousel slide, using a server-minted progressive MP4.
 */

import {useEffect, useRef} from 'react';

interface CarouselNativeVideoProps {
  src: string;
  active: boolean;
  onPlaybackError?: () => void;
}

export function CarouselNativeVideo({src, active, onPlaybackError}: CarouselNativeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active) {
      void video.play().catch(() => {
        // Autoplay can be blocked until the first gesture; swipe is enough.
      });
    } else {
      video.pause();
    }
  }, [active, src]);

  return (
    <div className="vp-proto-carousel__player" aria-hidden data-player="native">
      <video
        ref={videoRef}
        className="vp-proto-carousel__video"
        src={src}
        muted
        playsInline
        loop
        preload="auto"
        disablePictureInPicture
        onError={() => onPlaybackError?.()}
      />
    </div>
  );
}
