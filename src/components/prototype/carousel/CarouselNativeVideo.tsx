'use client';

/**
 * Native muted preview for a carousel slide, using a server-minted progressive MP4.
 * Optional previewStartSeconds / previewEndSeconds loop a bounded range;
 * otherwise the element uses the native loop attribute for the full clip.
 */

import {useEffect, useRef, useState} from 'react';

/** Skip currentTime assignment when already at the in-point (avoids a seek that cancels play()). */
const SEEK_TOLERANCE_S = 0.05;

const READY_EVENTS = [
  'loadedmetadata',
  'loadeddata',
  'canplay',
  'canplaythrough',
  'seeked',
  'progress',
  'waiting',
  'stalled',
  'emptied',
] as const;

function isCarouselPreviewReady(
  video: HTMLVideoElement,
  startSeconds: number | null | undefined,
): boolean {
  if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return false;
  // Playing: currentTime leaving the in-point is expected. Keep the frame
  // visible unless readyState itself drops (real stall / waiting).
  if (!video.paused) return true;
  if (startSeconds == null) return true;
  return Math.abs(video.currentTime - startSeconds) <= SEEK_TOLERANCE_S;
}

interface CarouselNativeVideoProps {
  src: string;
  active: boolean;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  onPlaybackError?: () => void;
  onReadyChange?: (ready: boolean) => void;
}

export function CarouselNativeVideo({
  src,
  active,
  previewStartSeconds,
  previewEndSeconds,
  onPlaybackError,
  onReadyChange,
}: CarouselNativeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startRef = useRef(previewStartSeconds);
  const endRef = useRef(previewEndSeconds);
  const activeRef = useRef(active);
  const onReadyChangeRef = useRef(onReadyChange);
  const lastReadyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const boundedLoop = previewEndSeconds != null;

  onReadyChangeRef.current = onReadyChange;

  useEffect(() => {
    startRef.current = previewStartSeconds;
    endRef.current = previewEndSeconds;
  }, [previewStartSeconds, previewEndSeconds]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const reportReady = (video: HTMLVideoElement) => {
    const next = isCarouselPreviewReady(video, startRef.current);
    if (next === lastReadyRef.current) return;
    lastReadyRef.current = next;
    setReady(next);
    onReadyChangeRef.current?.(next);
  };

  const showVideo = ready;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (startRef.current != null) {
      video.currentTime = startRef.current;
    }
    reportReady(video);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onReadyEvent = () => reportReady(video);
    onReadyEvent();
    for (const event of READY_EVENTS) {
      video.addEventListener(event, onReadyEvent);
    }
    return () => {
      for (const event of READY_EVENTS) {
        video.removeEventListener(event, onReadyEvent);
      }
      if (lastReadyRef.current) {
        lastReadyRef.current = false;
        setReady(false);
        onReadyChangeRef.current?.(false);
      }
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      if (!activeRef.current) return;
      void video.play().catch(() => {
        // Autoplay can be blocked until the first gesture; swipe is enough.
      });
    };

    if (!active) {
      video.pause();
      reportReady(video);
      return;
    }

    const start = startRef.current;
    const needsSeek =
      start != null && Math.abs(video.currentTime - start) > SEEK_TOLERANCE_S;

    if (needsSeek) {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        tryPlay();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = start;
      reportReady(video);
      tryPlay();
      return () => video.removeEventListener('seeked', onSeeked);
    }

    tryPlay();
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
          showVideo
            ? 'vp-proto-carousel__video is-visible'
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
          if (!video) return;
          if (startRef.current != null) {
            video.currentTime = startRef.current;
          }
          reportReady(video);
        }}
        onError={() => onPlaybackError?.()}
      />
    </div>
  );
}
