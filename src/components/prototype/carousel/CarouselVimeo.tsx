'use client';

/**
 * Prototype player layer — mount only inside the 3-item window.
 * Tries a server-minted native MP4 first; falls back to the Vimeo iframe
 * for that slide if minting fails.
 */

import {useEffect, useState} from 'react';
import {extractVimeoId} from '@/lib/vimeo';
import {normalizeStoredVideoUrl} from '@/lib/video-url';
import {CarouselNativeVideo} from './CarouselNativeVideo';
import {CarouselVimeoEmbed} from './CarouselVimeoEmbed';

interface CarouselVimeoProps {
  vimeoUrl: string;
  active: boolean;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  onReadyChange?: (ready: boolean) => void;
  onPlaying?: () => void;
}

type MintResult = {
  url: string;
};

export function CarouselVimeo({
  vimeoUrl,
  active,
  previewStartSeconds,
  previewEndSeconds,
  onReadyChange,
  onPlaying,
}: CarouselVimeoProps) {
  const videoId = extractVimeoId(normalizeStoredVideoUrl(vimeoUrl));
  const [mint, setMint] = useState<MintResult | null>(null);
  const [useIframe, setUseIframe] = useState(!videoId);

  useEffect(() => {
    if (useIframe || !mint) {
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
      try {
        const res = await fetch(`/api/vimeo-preview/${videoId}`, {
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
        setMint({url: body.url});
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
      />
    );
  }

  if (!mint) return null;

  return (
    <CarouselNativeVideo
      src={mint.url}
      active={active}
      previewStartSeconds={previewStartSeconds}
      previewEndSeconds={previewEndSeconds}
      onPlaybackError={() => setUseIframe(true)}
      onReadyChange={onReadyChange}
      onPlaying={onPlaying}
    />
  );
}
