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
// TEMP-DIAGNOSTIC — remove after investigation
import {
  HLS_NEIGHBOR_PROBE_MODE,
  probeUseMutedAutoplayPause,
} from './hls-neighbor-probe';

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

/** Coded aspect as a CSS `width / height` expression, or null before metadata. */
function previewAspectValue(video: HTMLVideoElement): string | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width <= 0 || height <= 0) return null;
  return `${width} / ${height}`;
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
  const playerRef = useRef<HTMLDivElement>(null);
  const appliedAspectRef = useRef<string | null>(null);
  const startRef = useRef(previewStartSeconds);
  const endRef = useRef(previewEndSeconds);
  const activeRef = useRef(active);
  const formatRef = useRef(playbackFormat);
  const onReadyChangeRef = useRef(onReadyChange);
  const lastReadyRef = useRef(false);
  const hasBeenReadyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const boundedLoop = previewEndSeconds != null;
  // TEMP-DIAGNOSTIC — remove after investigation
  const probeIdRef = useRef(
    `v-${Math.random().toString(36).slice(2, 7)}`,
  );
  const probeMountTRef = useRef(0);
  const probeLastRsRef = useRef(-1);
  const probeFirstReadyTRef = useRef<number | null>(null);
  const probeReadyWhileInactiveRef = useRef(false);
  const probeActivateTRef = useRef<number | null>(null);
  const probeLoggedActivateWaitRef = useRef(false);

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

  const applyPreviewAspect = (video: HTMLVideoElement) => {
    const player = playerRef.current;
    if (!player) return;
    const value = previewAspectValue(video);
    if (value == null || value === appliedAspectRef.current) return;
    appliedAspectRef.current = value;
    player.style.setProperty('--vp-preview-aspect', value);
  };

  const reportReady = (video: HTMLVideoElement) => {
    applyPreviewAspect(video);
    const readyNow =
      formatRef.current === 'hls'
        ? isHlsPreviewReady(video)
        : isCarouselPreviewReady(video, startRef.current);

    // TEMP-DIAGNOSTIC — remove after investigation
    if (formatRef.current === 'hls') {
      const t = performance.now();
      const rs = video.readyState;
      if (rs !== probeLastRsRef.current) {
        const sinceMount = probeMountTRef.current
          ? (t - probeMountTRef.current).toFixed(0)
          : '?';
        console.log(
          `[hls-probe] id=${probeIdRef.current} event=readyState t=${t.toFixed(1)} sinceMountMs=${sinceMount} rs=${probeLastRsRef.current}->${rs} active=${activeRef.current} paused=${video.paused}`,
        );
        probeLastRsRef.current = rs;
      }
      if (readyNow && probeFirstReadyTRef.current == null) {
        probeFirstReadyTRef.current = t;
        if (!activeRef.current) {
          probeReadyWhileInactiveRef.current = true;
        }
        const sinceMount = probeMountTRef.current
          ? (t - probeMountTRef.current).toFixed(0)
          : '?';
        console.log(
          `[hls-probe] id=${probeIdRef.current} event=first-ready t=${t.toFixed(1)} sinceMountMs=${sinceMount} active=${activeRef.current} readyWhileInactive=${probeReadyWhileInactiveRef.current}`,
        );
      }
      if (
        activeRef.current &&
        probeActivateTRef.current != null &&
        readyNow &&
        !probeLoggedActivateWaitRef.current
      ) {
        probeLoggedActivateWaitRef.current = true;
        const waitMs = (t - probeActivateTRef.current).toFixed(0);
        console.log(
          `[hls-probe] id=${probeIdRef.current} event=ready-after-activate waitMs=${waitMs} wasReadyBeforeActivate=${probeReadyWhileInactiveRef.current}`,
        );
      }
    }

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
    // TEMP-DIAGNOSTIC — remove after investigation
    if (formatRef.current === 'hls') {
      probeMountTRef.current = performance.now();
      probeLastRsRef.current = video.readyState;
      probeFirstReadyTRef.current = null;
      probeReadyWhileInactiveRef.current = false;
      probeActivateTRef.current = null;
      probeLoggedActivateWaitRef.current = false;
      const srcTail = src.split('/').pop()?.slice(0, 24) ?? '?';
      console.log(
        `[hls-probe] id=${probeIdRef.current} event=mount mode=${HLS_NEIGHBOR_PROBE_MODE} t=${probeMountTRef.current.toFixed(1)} active=${activeRef.current} rs=${video.readyState} srcTail=${srcTail}`,
      );
    }
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
      hasBeenReadyRef.current = false;
      appliedAspectRef.current = null;
      player?.style.removeProperty('--vp-preview-aspect');
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

        // TEMP-DIAGNOSTIC — remove after investigation
        // Coax iOS into buffering while visually inactive (poster still covers).
        if (probeUseMutedAutoplayPause()) {
          const kickBuffer = () => {
            if (cancelled || activeRef.current) return;
            video.muted = true;
            console.log(
              `[hls-probe] id=${probeIdRef.current} event=autoplay-pause-start t=${performance.now().toFixed(1)} rs=${video.readyState}`,
            );
            void video
              .play()
              .then(() => {
                if (cancelled) return;
                if (!activeRef.current) {
                  video.pause();
                }
                reportReady(video);
                console.log(
                  `[hls-probe] id=${probeIdRef.current} event=autoplay-pause-done t=${performance.now().toFixed(1)} rs=${video.readyState} active=${activeRef.current} paused=${video.paused}`,
                );
              })
              .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                console.log(
                  `[hls-probe] id=${probeIdRef.current} event=autoplay-pause-fail t=${performance.now().toFixed(1)} rs=${video.readyState} err=${msg}`,
                );
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
        }

        return cleanup;
      }

      // TEMP-DIAGNOSTIC — remove after investigation
      probeActivateTRef.current = performance.now();
      probeLoggedActivateWaitRef.current = false;
      const alreadyReady = isHlsPreviewReady(video) || hasBeenReadyRef.current;
      console.log(
        `[hls-probe] id=${probeIdRef.current} event=activate t=${probeActivateTRef.current.toFixed(1)} rs=${video.readyState} alreadyReady=${alreadyReady} readyWhileInactive=${probeReadyWhileInactiveRef.current} sinceMountMs=${(
          probeActivateTRef.current - probeMountTRef.current
        ).toFixed(0)}`,
      );
      if (alreadyReady) {
        probeLoggedActivateWaitRef.current = true;
        console.log(
          `[hls-probe] id=${probeIdRef.current} event=ready-before-activate waitMs=0`,
        );
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
