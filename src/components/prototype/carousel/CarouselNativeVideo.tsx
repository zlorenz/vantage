'use client';

/**
 * Native muted preview for a carousel slide, using a server-minted progressive MP4.
 * Optional previewStartSeconds / previewEndSeconds loop a bounded range;
 * otherwise the element uses the native loop attribute for the full clip.
 */

import {useEffect, useRef, useState} from 'react';

/** Independent of SLIDE_DURATION_MS — poster hold must not couple to paging/neighbor mount. */
const POSTER_HOLD_MS = 800;

interface CarouselNativeVideoProps {
  src: string;
  active: boolean;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  onPlaybackError?: () => void;
}

export function CarouselNativeVideo({
  src,
  active,
  previewStartSeconds,
  previewEndSeconds,
  onPlaybackError,
}: CarouselNativeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startRef = useRef(previewStartSeconds);
  const endRef = useRef(previewEndSeconds);
  const activeRef = useRef(active);
  const boundedLoop = previewEndSeconds != null;
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    startRef.current = previewStartSeconds;
    endRef.current = previewEndSeconds;
  }, [previewStartSeconds, previewEndSeconds]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (startRef.current != null) {
      video.currentTime = startRef.current;
    }
  }, [src]);

  useEffect(() => {
    setVideoReady(false);
    const video = videoRef.current;
    if (!video) return;

    const mountedAt = performance.now();
    let holdTimer: number | null = null;
    let hasPlaying = false;
    let revealed = false;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setVideoReady(true);
    };

    const onPlaying = () => {
      if (hasPlaying) return;
      hasPlaying = true;
      const remaining = POSTER_HOLD_MS - (performance.now() - mountedAt);
      if (remaining <= 0) {
        reveal();
      } else {
        holdTimer = window.setTimeout(reveal, remaining);
      }
    };

    video.addEventListener('playing', onPlaying);
    return () => {
      video.removeEventListener('playing', onPlaying);
      if (holdTimer != null) window.clearTimeout(holdTimer);
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active) {
      if (startRef.current != null) {
        video.currentTime = startRef.current;
      }
      void video.play().catch(() => {
        // Autoplay can be blocked until the first gesture; swipe is enough.
      });
    } else {
      video.pause();
    }
  }, [active, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !boundedLoop) return;

    const onTimeUpdate = () => {
      const end = endRef.current;
      if (end == null || !activeRef.current) return;
      if (video.currentTime >= end) {
        video.currentTime = startRef.current ?? 0;
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [src, boundedLoop]);

  return (
    <div className="vp-proto-carousel__player" aria-hidden data-player="native">
      <video
        ref={videoRef}
        className={
          videoReady
            ? 'vp-proto-carousel__video is-ready'
            : 'vp-proto-carousel__video'
        }
        src={src}
        muted
        playsInline
        loop={!boundedLoop}
        preload="auto"
        disablePictureInPicture
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video && startRef.current != null) {
            video.currentTime = startRef.current;
          }
        }}
        onError={() => onPlaybackError?.()}
      />
    </div>
  );
}
