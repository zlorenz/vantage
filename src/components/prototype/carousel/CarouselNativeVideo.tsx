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
 *   for `seeked`. Inactive HLS neighbors still muted-play briefly to the
 *   in-point so WebKit buffers to HAVE_ENOUGH_DATA before activation.
 *   None of the progressive seek-gating runs on the HLS path.
 *
 * Preload: active slide is always `auto`. Inactive neighbors use `auto`
 * on desktop and `metadata` on mobile (<768px) to avoid multi-slide 720p
 * downloads on first paint.
 *
 * Everything else — the element setup, the ready latch, the active/inactive
 * pause, and the bounded in/out loop — is shared by both.
 */

import {useEffect, useRef, useState} from 'react';
import {carouselVideoPreload} from './carousel-preload';
import {
  detectPillarboxContentAspect,
  isCarouselCoverMathEnabled,
  scheduleIdleWork,
} from './detect-pillarbox-aspect';
import {useCarouselDesktopViewport} from './use-carousel-desktop-viewport';

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

/** Coded aspect as a unitless width/height ratio, or null before metadata. */
function previewAspectValue(video: HTMLVideoElement): number | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width <= 0 || height <= 0) return null;
  return width / height;
}

/**
 * Cover aspect for the media stack: coded size, tightened by a poster
 * pillarbox scan when the master has baked-in side bars.
 */
export function resolveCoverAspect(
  codedAspect: number | null,
  contentAspectHint: number | null | undefined,
): number | null {
  if (codedAspect == null && contentAspectHint == null) return null;
  if (codedAspect == null) return contentAspectHint ?? null;
  if (contentAspectHint == null) return codedAspect;
  // Narrower aspect = taller relative frame = more side crop (pillarbox zoom).
  return Math.min(codedAspect, contentAspectHint);
}

export type PlaybackFormat = 'progressive' | 'hls';

interface CarouselNativeVideoProps {
  src: string;
  active: boolean;
  /** Defaults to the progressive MP4 path; 'hls' is the iOS WebKit path. */
  playbackFormat?: PlaybackFormat;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  /**
   * Content aspect from poster pillarbox scan (width/height). When narrower
   * than the coded video aspect, cover-math zooms to crop baked-in side bars.
   */
  contentAspectHint?: number | null;
  onPlaybackError?: () => void;
  onReadyChange?: (ready: boolean) => void;
}

export function CarouselNativeVideo({
  src,
  active,
  playbackFormat = 'progressive',
  previewStartSeconds,
  previewEndSeconds,
  contentAspectHint = null,
  onPlaybackError,
  onReadyChange,
}: CarouselNativeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const appliedAspectRef = useRef<number | null>(null);
  const scannedFrameRef = useRef(false);
  const scanScheduledRef = useRef(false);
  const cancelIdleScanRef = useRef<(() => void) | null>(null);
  const contentAspectHintRef = useRef(contentAspectHint);
  /** Frame-scan hint — kept across ready events so applyCodedAspect cannot clobber it. */
  const frameAspectHintRef = useRef<number | null>(null);
  const startRef = useRef(previewStartSeconds);
  const endRef = useRef(previewEndSeconds);
  const activeRef = useRef(active);
  const formatRef = useRef(playbackFormat);
  const onReadyChangeRef = useRef(onReadyChange);
  const lastReadyRef = useRef(false);
  const hasBeenReadyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const boundedLoop = previewEndSeconds != null;
  const desktopViewport = useCarouselDesktopViewport();
  const preload = carouselVideoPreload(active, desktopViewport);

  onReadyChangeRef.current = onReadyChange;
  contentAspectHintRef.current = contentAspectHint;

  const effectiveContentAspectHint = (): number | null => {
    const hints = [contentAspectHintRef.current, frameAspectHintRef.current].filter(
      (n): n is number => n != null && Number.isFinite(n) && n > 0,
    );
    return hints.length > 0 ? Math.min(...hints) : null;
  };

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

  const writeCoverAspect = (value: number | null) => {
    if (!isCarouselCoverMathEnabled()) return;
    const player = playerRef.current;
    const stack = player?.closest(
      '.vp-proto-carousel__media-stack',
    ) as HTMLElement | null;
    const target = stack ?? player;
    if (!target) return;
    if (value == null || value === appliedAspectRef.current) return;
    appliedAspectRef.current = value;
    target.style.setProperty('--vp-preview-aspect', String(value));
  };

  const applyCodedAspect = (video: HTMLVideoElement) => {
    writeCoverAspect(
      resolveCoverAspect(
        previewAspectValue(video),
        effectiveContentAspectHint(),
      ),
    );
  };

  const scanFrameOnce = (video: HTMLVideoElement) => {
    if (scannedFrameRef.current || !isCarouselCoverMathEnabled()) return;
    const coded = previewAspectValue(video);
    // Wait for coded size — do not lock the one-shot flag on an empty frame.
    if (coded == null) return;
    scannedFrameRef.current = true;
    const fromFrame = detectPillarboxContentAspect(
      video,
      video.videoWidth,
      video.videoHeight,
    );
    if (fromFrame != null && Number.isFinite(fromFrame) && fromFrame > 0) {
      frameAspectHintRef.current = fromFrame;
    }
    writeCoverAspect(resolveCoverAspect(coded, effectiveContentAspectHint()));
  };

  const scheduleFrameScan = (video: HTMLVideoElement) => {
    if (
      scanScheduledRef.current ||
      scannedFrameRef.current ||
      !isCarouselCoverMathEnabled()
    ) {
      return;
    }
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    scanScheduledRef.current = true;
    cancelIdleScanRef.current = scheduleIdleWork(() => {
      cancelIdleScanRef.current = null;
      scanFrameOnce(video);
    });
  };

  const reportReady = (video: HTMLVideoElement) => {
    applyCodedAspect(video);
    scheduleFrameScan(video);
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
    const player = playerRef.current;
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
      cancelIdleScanRef.current?.();
      cancelIdleScanRef.current = null;
      scannedFrameRef.current = false;
      scanScheduledRef.current = false;
      frameAspectHintRef.current = null;
      hasBeenReadyRef.current = false;
      appliedAspectRef.current = null;
      const stack = player?.closest(
        '.vp-proto-carousel__media-stack',
      ) as HTMLElement | null;
      (stack ?? player)?.style.removeProperty('--vp-preview-aspect');
      if (lastReadyRef.current) {
        lastReadyRef.current = false;
        setReady(false);
        onReadyChangeRef.current?.(false);
      }
    };
  }, [src]);

  // Poster pillarbox scan can finish after metadata — re-resolve cover aspect.
  useEffect(() => {
    if (!isCarouselCoverMathEnabled()) return;
    const video = videoRef.current;
    const coded = video ? previewAspectValue(video) : null;
    writeCoverAspect(resolveCoverAspect(coded, effectiveContentAspectHint()));
  }, [contentAspectHint]);

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

        // iOS WebKit will not buffer paused HLS toward HAVE_ENOUGH_DATA.
        // Seek to the in-point, muted-play briefly, then pause so neighbors
        // latch ready before activation (poster can skip). Video stays
        // opacity:0 until ready; muted for the whole kick.
        const kickBuffer = () => {
          if (cancelled || activeRef.current) return;
          video.muted = true;
          const start = startRef.current;
          if (!needsNoSeek(start)) {
            video.currentTime = start;
          }
          void video
            .play()
            .then(() => {
              if (cancelled) return;
              if (!activeRef.current) {
                video.pause();
              }
              reportReady(video);
            })
            .catch(() => {
              // Autoplay can be blocked until the first gesture; swipe is enough.
            });
        };

        if (hasVideoMetadata(video)) {
          kickBuffer();
        } else {
          const onMetadata = () => {
            video.removeEventListener('loadedmetadata', onMetadata);
            metadataListener = null;
            kickBuffer();
          };
          metadataListener = onMetadata;
          video.addEventListener('loadedmetadata', onMetadata);
        }

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
      ref={playerRef}
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
        crossOrigin="anonymous"
        muted
        playsInline
        loop={!boundedLoop}
        preload={preload}
        disablePictureInPicture
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => onPlaybackError?.()}
      />
    </div>
  );
}
