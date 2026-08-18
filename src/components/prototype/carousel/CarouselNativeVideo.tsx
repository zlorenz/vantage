'use client';

/**
 * Native muted preview for a carousel slide, using a server-minted progressive MP4.
 * Optional previewStartSeconds / previewEndSeconds loop a bounded range;
 * otherwise the element uses the native loop attribute for the full clip.
 */

import {useEffect, useRef, useState} from 'react';

/** Skip currentTime assignment when already at the in-point (avoids a seek that cancels play()). */
const SEEK_TOLERANCE_S = 0.05;
/** Retry once when Safari accepts currentTime but never fires seeked. */
const SEEK_RETRY_MS = 400;

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

function isAtInPoint(
  video: HTMLVideoElement,
  startSeconds: number | null | undefined,
): boolean {
  if (startSeconds == null) return true;
  return Math.abs(video.currentTime - startSeconds) <= SEEK_TOLERANCE_S;
}

/**
 * Safe to play. currentTime reports the seek *target* while seeking is true
 * (HTML/WebKit IDL) — that is not a completed seek.
 */
function isSettledAtInPoint(
  video: HTMLVideoElement,
  startSeconds: number | null | undefined,
): boolean {
  return !video.seeking && isAtInPoint(video, startSeconds);
}

function hasVideoMetadata(video: HTMLVideoElement): boolean {
  return video.readyState >= HTMLMediaElement.HAVE_METADATA;
}

/**
 * Assign currentTime to the in-point when metadata is loaded and the playhead
 * is not already within tolerance. No-op before HAVE_METADATA (Safari ignores it).
 */
function seekToInPoint(
  video: HTMLVideoElement,
  startSeconds: number | null | undefined,
): boolean {
  if (startSeconds == null) return false;
  if (!hasVideoMetadata(video)) return false;
  if (isAtInPoint(video, startSeconds)) return false;
  video.currentTime = startSeconds;
  return true;
}

function isCarouselPreviewReady(
  video: HTMLVideoElement,
  startSeconds: number | null | undefined,
): boolean {
  if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return false;
  if (!video.paused) {
    // Playing while a seek is still pending presents buffered frames (often
    // the start of a progressive MP4) under a currentTime that already
    // reads as the in-point. Do not reveal that as ready.
    if (video.seeking) return false;
    if (startSeconds == null) return true;
    return video.currentTime >= startSeconds - SEEK_TOLERANCE_S;
  }
  if (startSeconds == null) return true;
  return isSettledAtInPoint(video, startSeconds);
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
  const hasBeenReadyRef = useRef(false);
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
    if (isCarouselPreviewReady(video, startRef.current)) {
      hasBeenReadyRef.current = true;
    }
    // Latch once a real frame has shown. Seeking a paused slide back to
    // its in-point fails isCarouselPreviewReady (paused + off-in-point),
    // which used to reshow the poster over the last decoded frame.
    const next = hasBeenReadyRef.current;
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
    seekToInPoint(video, startRef.current);
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
      hasBeenReadyRef.current = false;
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

    let cancelled = false;
    let seekedListener: (() => void) | null = null;
    let metadataListener: (() => void) | null = null;
    let seekRetryTimer: ReturnType<typeof setTimeout> | null = null;

    const clearSeekWait = () => {
      if (seekedListener) {
        video.removeEventListener('seeked', seekedListener);
        seekedListener = null;
      }
      if (metadataListener) {
        video.removeEventListener('loadedmetadata', metadataListener);
        metadataListener = null;
      }
      if (seekRetryTimer != null) {
        clearTimeout(seekRetryTimer);
        seekRetryTimer = null;
      }
    };

    const cleanup = () => {
      cancelled = true;
      clearSeekWait();
    };

    const tryPlay = () => {
      if (cancelled || !activeRef.current) return;
      void video.play().catch(() => {
        // Autoplay can be blocked until the first gesture; swipe is enough.
      });
    };

    const finishAtInPoint = () => {
      if (cancelled || !activeRef.current) return;
      clearSeekWait();
      reportReady(video);
      tryPlay();
    };

    const waitForSeeked = (start: number, allowRetry: boolean) => {
      clearSeekWait();

      const onSeeked = () => {
        if (cancelled || !activeRef.current) return;
        if (!isSettledAtInPoint(video, start)) return;
        video.removeEventListener('seeked', onSeeked);
        seekedListener = null;
        if (seekRetryTimer != null) {
          clearTimeout(seekRetryTimer);
          seekRetryTimer = null;
        }
        finishAtInPoint();
      };

      seekedListener = onSeeked;
      video.addEventListener('seeked', onSeeked);

      if (allowRetry) {
        seekRetryTimer = setTimeout(() => {
          seekRetryTimer = null;
          if (cancelled || !activeRef.current) return;
          if (isSettledAtInPoint(video, start)) {
            finishAtInPoint();
            return;
          }
          // Targeting the in-point but still seeking: keep waiting for
          // seeked. Do not play() and do not re-assign currentTime.
          if (isAtInPoint(video, start)) return;
          seekToInPoint(video, start);
          waitForSeeked(start, false);
        }, SEEK_RETRY_MS);
      }
    };

    const beginSeekAndPlay = (start: number) => {
      if (cancelled || !activeRef.current) return;

      if (isSettledAtInPoint(video, start)) {
        finishAtInPoint();
        return;
      }

      if (!hasVideoMetadata(video)) {
        const onMetadata = () => {
          if (cancelled) return;
          video.removeEventListener('loadedmetadata', onMetadata);
          metadataListener = null;
          if (!activeRef.current) {
            seekToInPoint(video, start);
            reportReady(video);
            return;
          }
          beginSeekAndPlay(start);
        };
        metadataListener = onMetadata;
        video.addEventListener('loadedmetadata', onMetadata);
        return;
      }

      if (!seekToInPoint(video, start)) {
        if (isSettledAtInPoint(video, start)) {
          finishAtInPoint();
          return;
        }
        waitForSeeked(start, true);
        return;
      }

      waitForSeeked(start, true);
    };

    if (!active) {
      video.pause();
      clearSeekWait();
      reportReady(video);
      return cleanup;
    }

    const start = startRef.current;
    if (start == null || isSettledAtInPoint(video, start)) {
      reportReady(video);
      tryPlay();
      return cleanup;
    }

    beginSeekAndPlay(start);
    return cleanup;
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

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    seekToInPoint(video, startRef.current);
    reportReady(video);
  };

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
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => onPlaybackError?.()}
      />
    </div>
  );
}
