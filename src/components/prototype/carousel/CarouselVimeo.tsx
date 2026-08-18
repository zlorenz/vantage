'use client';

/**
 * Prototype player layer — mount only inside the 3-item window.
 * Tries a server-minted native source first; falls back to the Vimeo iframe
 * for that slide if minting or playback fails.
 *
 * iOS WebKit gets HLS because it will not range-seek a progressive MP4;
 * every other client keeps the progressive MP4 path unchanged.
 */

import {useEffect, useState} from 'react';
import {isIOSWebKit} from '@/lib/ios-webkit';
import {extractVimeoId} from '@/lib/vimeo';
import {normalizeStoredVideoUrl} from '@/lib/video-url';
import {CarouselNativeVideo, type PlaybackFormat} from './CarouselNativeVideo';
import {CarouselVimeoEmbed} from './CarouselVimeoEmbed';

interface CarouselVimeoProps {
  vimeoUrl: string;
  active: boolean;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  onReadyChange?: (ready: boolean) => void;
}

type MintResult = {
  url: string;
  format: PlaybackFormat;
};

export function CarouselVimeo({
  vimeoUrl,
  active,
  previewStartSeconds,
  previewEndSeconds,
  onReadyChange,
}: CarouselVimeoProps) {
  const videoId = extractVimeoId(normalizeStoredVideoUrl(vimeoUrl));
  const [mint, setMint] = useState<MintResult | null>(null);
  const [useIframe, setUseIframe] = useState(!videoId);

  useEffect(() => {
    if (!useIframe && !mint) {
      onReadyChange?.(false);
    }
  }, [useIframe, mint, onReadyChange]);

  useEffect(() => {
    if (!videoId) {
      setUseIframe(true);
      return;
    }

    const controller = new AbortController();
    setMint(null);
    setUseIframe(false);

    void (async () => {
      // Read in the effect, never during render — isIOSWebKit is false on the
      // server and would otherwise desync hydration.
      const format: PlaybackFormat = isIOSWebKit() ? 'hls' : 'progressive';
      const query = format === 'hls' ? '?format=hls' : '';

      try {
        const res = await fetch(`/api/vimeo-preview/${videoId}${query}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setUseIframe(true);
          return;
        }
        const body = (await res.json()) as {url?: string};
        if (!body.url) {
          setUseIframe(true);
          return;
        }
        setMint({url: body.url, format});
      } catch {
        if (controller.signal.aborted) return;
        setUseIframe(true);
      }
    })();

    return () => controller.abort();
  }, [videoId]);

  if (useIframe) {
    return (
      <CarouselVimeoEmbed
        vimeoUrl={vimeoUrl}
        active={active}
        previewStartSeconds={previewStartSeconds}
        previewEndSeconds={previewEndSeconds}
        onReadyChange={onReadyChange}
      />
    );
  }

  if (!mint) return null;

  return (
    <CarouselNativeVideo
      src={mint.url}
      playbackFormat={mint.format}
      active={active}
      previewStartSeconds={previewStartSeconds}
      previewEndSeconds={previewEndSeconds}
      onPlaybackError={() => setUseIframe(true)}
      onReadyChange={onReadyChange}
    />
  );
}
