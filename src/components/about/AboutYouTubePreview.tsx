'use client';

/**
 * Muted looping YouTube iframe for About preview slots.
 * Inactive clips unmount so only the selected tab autoplays.
 */

import {useEffect, useRef} from 'react';

type AboutYouTubePreviewProps = {
  videoId: string;
  active: boolean;
  onReadyChange?: (ready: boolean) => void;
};

function mutedLoopSrc(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    fs: '0',
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

export function AboutYouTubePreview({
  videoId,
  active,
  onReadyChange,
}: AboutYouTubePreviewProps) {
  const onReadyChangeRef = useRef(onReadyChange);
  onReadyChangeRef.current = onReadyChange;

  useEffect(() => {
    if (!active) {
      onReadyChangeRef.current?.(false);
    }
  }, [active, videoId]);

  if (!active) return null;

  return (
    <div className="vp-home-carousel__player" aria-hidden data-player="youtube">
      <iframe
        src={mutedLoopSrc(videoId)}
        title="About preview video"
        className="vp-home-carousel__iframe"
        allow="autoplay; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
        tabIndex={-1}
        onLoad={() => onReadyChangeRef.current?.(true)}
      />
    </div>
  );
}
