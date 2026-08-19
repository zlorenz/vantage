'use client';

/**
 * Native muted preview for a carousel slide, using a server-minted source.
 * Optional previewStartSeconds / previewEndSeconds loop a bounded range;
 * otherwise the element uses the native loop attribute for the full clip.
 *
 * Two activation paths share this element:
 *
 * - `progressive` (desktop) drives the seek-gating below, which exists to
 *   survive a seek that may never report completion.
 * - `hls` (iOS WebKit) waits for metadata, then always re-assigns the
 *   in-point immediately before play(). It does not trust a seek that
 *   ran while the slide was an inactive neighbor, and it does not wait
 *   for `seeked`. None of the progressive seek-gating runs there.
 *
 * Everything else — the element setup, the ready latch, the active/inactive
 * pause, and the bounded in/out loop — is shared by both.
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

/**
 * Sanity stores "play from the start" as 0, not null. `?? null` in
 * load-slides only converts missing values. 0 must not enter seek-wait
 * (timeline origin never needs a seek). Explicit `=== 0`, not falsy.
 */
function needsNoSeek(
  start: number | null | undefined,
): start is null | undefined | 0 {
  return start == null || start === 0;
}

function isAtInPoint(
  video: HTMLVideoElement,
  startSeconds: number | null | undefined,
): boolean {
  if (needsNoSeek(startSeconds)) return true;
  return Math.abs(video.currentTime - startSeconds) <= SEEK_TOLERANCE_S;
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
  if (needsNoSeek(startSeconds)) return false;
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
    if (needsNoSeek(startSeconds)) return true;
    // Playing before the in-point is not ready (mobile Safari race at t=0).
    return video.currentTime >= startSeconds - SEEK_TOLERANCE_S;
  }
  if (needsNoSeek(startSeconds)) return true;
  return isAtInPoint(video, startSeconds);
}

/**
 * HLS readiness drops the in-point comparisons of isCarouselPreviewReady:
 * those exist only to catch the progressive seek race, and on a path where
 * the seek lands they would hold the poster over a frame that is already
 * correct. Same buffer threshold as progressive.
 */
function isHlsPreviewReady(video: HTMLVideoElement): boolean {
  return video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;
}

export type PlaybackFormat = 'progressive' | 'hls';

interface CarouselNativeVideoProps {
  src: string;
  active: boolean;
  /** Defaults to the progressive MP4 path; 'hls' is the iOS WebKit path. */
  playbackFormat?: PlaybackFormat;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  onPlaybackError?: () => void;
  onReadyChange?: (ready: boolean) => void;
}

export function CarouselNativeVideo({
  src,
  active,
  playbackFormat = 'progressive',
  previewStartSeconds,
  previewEndSeconds,
  onPlaybackError,
  onReadyChange,
}: CarouselNativeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startRef = useRef(previewStartSeconds);
  const endRef = useRef(previewEndSeconds);
  const activeRef = useRef(active);
  const formatRef = useRef(playbackFormat);
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

  useEffect(() => {
    formatRef.current = playbackFormat;
  }, [playbackFormat]);

  const reportReady = (video: HTMLVideoElement) => {
    const readyNow =
      formatRef.current === 'hls'
        ? isHlsPreviewReady(video)
        : isCarouselPreviewReady(video, startRef.current);
    if (readyNow) {
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
    // HLS seeks only when the slide becomes active — a paused neighbor seek
    // does not complete on iOS WebKit but currentTime reads back as the target.
    if (formatRef.current !== 'hls') {
      seekToInPoint(video, startRef.current);
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

    if (playbackFormat === 'hls') {
      let cancelled = false;
      let metadataListener: (() => void) | null = null;

      const cleanup = () => {
        cancelled = true;
        if (metadataListener) {
          video.removeEventListener('loadedmetadata', metadataListener);
          metadataListener = null;
        }
      };

      if (!active) {
        video.pause();
        reportReady(video);
        return cleanup;
      }

      const startAtInPoint = () => {
        if (cancelled || !activeRef.current) return;
        const start = startRef.current;
        // Always assign on activation — isAtInPoint cannot be trusted after a
        // paused neighbor seek left currentTime at the target without landing.
        if (!needsNoSeek(start)) {
          video.currentTime = start;
        }
        reportReady(video);
        void video.play().catch(() => {
          // Autoplay can be blocked until the first gesture; swipe is enough.
        });
      };

      // currentTime before HAVE_METADATA is ignored, so wait for it. Then
      // startAtInPoint assigns the in-point and calls play() in the same
      // turn — no `seeked` gate, because progressive MP4 on this platform
      // may never fire that event. The assignment itself is not skipped.
      if (hasVideoMetadata(video)) {
        startAtInPoint();
      } else {
        const onMetadata = () => {
          video.removeEventListener('loadedmetadata', onMetadata);
          metadataListener = null;
          startAtInPoint();
        };
        metadataListener = onMetadata;
        video.addEventListener('loadedmetadata', onMetadata);
      }

      return cleanup;
    }

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
        if (!isAtInPoint(video, start)) return;
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
          if (isAtInPoint(video, start)) {
            finishAtInPoint();
            return;
          }
          seekToInPoint(video, start);
          waitForSeeked(start, false);
        }, SEEK_RETRY_MS);
      }
    };

    const beginSeekAndPlay = (start: number) => {
      if (cancelled || !activeRef.current) return;

      if (isAtInPoint(video, start)) {
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
        finishAtInPoint();
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

    if (needsNoSeek(start) || isAtInPoint(video, start)) {
      reportReady(video);
      tryPlay();
      return cleanup;
    }

    beginSeekAndPlay(start);
    return cleanup;
  }, [active, src, playbackFormat]);

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
    if (formatRef.current !== 'hls') {
      seekToInPoint(video, startRef.current);
    }
    reportReady(video);
  };

  return (
    <div
      className="vp-proto-carousel__player"
      aria-hidden
      data-player="native"
      data-format={playbackFormat}
    >
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
