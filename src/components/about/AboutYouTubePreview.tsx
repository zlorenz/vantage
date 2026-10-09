'use client';

/**
 * Muted looping YouTube iframe for About preview slots and homepage
 * carousel slides. Inactive clips unmount so only the active surface autoplays.
 *
 * YouTube no longer exposes params to hide title/channel chrome — CSS on
 * `[data-player="youtube"]` scales the iframe past overflow:hidden.
 *
 * Loop via the IFrame API (not `playlist=` + `loop=`). Playlist mode paints
 * the center prev/pause/next transport that we cannot crop away.
 */

import {useEffect, useId, useRef, useState} from 'react';

type AboutYouTubePreviewProps = {
  videoId: string;
  active: boolean;
  onReadyChange?: (ready: boolean) => void;
};

/** YT.PlayerState */
const YT_ENDED = 0;
const YT_PLAYING = 1;

function mutedLoopSrc(videoId: string, origin: string, frameId: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    cc_load_policy: '0',
    fs: '0',
    disablekb: '1',
    enablejsapi: '1',
    origin,
    widgetid: frameId,
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

function postToFrame(
  iframe: HTMLIFrameElement,
  frameId: string,
  payload: Record<string, unknown>,
): void {
  iframe.contentWindow?.postMessage(
    JSON.stringify({...payload, id: frameId, channel: 'widget'}),
    'https://www.youtube.com',
  );
}

function commandFrame(
  iframe: HTMLIFrameElement,
  frameId: string,
  func: string,
  args: unknown[] = [],
): void {
  postToFrame(iframe, frameId, {event: 'command', func, args});
}

function restartPreview(iframe: HTMLIFrameElement, frameId: string): void {
  commandFrame(iframe, frameId, 'mute');
  commandFrame(iframe, frameId, 'seekTo', [0, true]);
  commandFrame(iframe, frameId, 'playVideo');
}

export function AboutYouTubePreview({
  videoId,
  active,
  onReadyChange,
}: AboutYouTubePreviewProps) {
  const onReadyChangeRef = useRef(onReadyChange);
  onReadyChangeRef.current = onReadyChange;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameId = `vp-yt-preview-${useId().replace(/:/g, '')}`;
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!active) {
      onReadyChangeRef.current?.(false);
    }
  }, [active, videoId]);

  useEffect(() => {
    if (!active || !origin) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let reportedReady = false;
    let started = false;
    let restarting = false;
    const markReady = () => {
      if (reportedReady) return;
      reportedReady = true;
      onReadyChangeRef.current?.(true);
    };
    const startOnce = () => {
      if (started) return;
      started = true;
      commandFrame(iframe, frameId, 'mute');
      commandFrame(iframe, frameId, 'playVideo');
      markReady();
    };
    const loopRestart = () => {
      if (restarting) return;
      restarting = true;
      restartPreview(iframe, frameId);
      window.setTimeout(() => {
        restarting = false;
      }, 500);
    };

    const announce = () => {
      postToFrame(iframe, frameId, {event: 'listening'});
    };
    const poll = window.setInterval(announce, 250);

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      let data: {
        event?: string;
        id?: string | number;
        info?:
          | number
          | {playerState?: number; currentTime?: number; duration?: number};
      };
      try {
        data =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (!data?.event) return;
      if (data.id != null && String(data.id) !== frameId) return;

      if (
        data.event === 'onReady' ||
        data.event === 'initialDelivery' ||
        data.event === 'readyToListen' ||
        data.event === 'alreadyInitialized'
      ) {
        // startOnce guards re-entry — re-calling playVideo on every
        // alreadyInitialized handshake flashes the center pause bezel.
        startOnce();
      }

      if (data.event === 'onStateChange' && typeof data.info === 'number') {
        if (data.info === YT_ENDED) {
          loopRestart();
        } else if (data.info === YT_PLAYING) {
          markReady();
        }
      }

      if (
        data.event === 'infoDelivery' &&
        data.info &&
        typeof data.info === 'object'
      ) {
        const state = data.info.playerState;
        if (state === YT_ENDED) {
          loopRestart();
        } else if (state === YT_PLAYING) {
          markReady();
        }
        // Seek before natural end so the ended/replay chrome never paints.
        const current = data.info.currentTime;
        const duration =
          data.info.duration ??
          (data.info as {progressState?: {duration?: number}}).progressState
            ?.duration;
        if (
          typeof current === 'number' &&
          typeof duration === 'number' &&
          duration > 1 &&
          current >= duration - 0.4
        ) {
          loopRestart();
        }
      }
    };

    window.addEventListener('message', onMessage);
    iframe.addEventListener('load', announce);
    announce();

    return () => {
      window.clearInterval(poll);
      window.removeEventListener('message', onMessage);
      iframe.removeEventListener('load', announce);
    };
  }, [active, origin, videoId, frameId]);

  if (!active || !origin) return null;

  return (
    <div className="vp-home-carousel__player" aria-hidden data-player="youtube">
      <iframe
        ref={iframeRef}
        src={mutedLoopSrc(videoId, origin, frameId)}
        title="Preview video"
        className="vp-home-carousel__iframe"
        allow="autoplay; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
        tabIndex={-1}
        onLoad={() => onReadyChangeRef.current?.(true)}
      />
    </div>
  );
}
