'use client';

/**
 * LazyVimeoPlayer — poster thumbnail until play; then loads a Vimeo iframe.
 *
 * Uses player.vimeo.com iframe (same pattern as LazyYouTubePlayer) instead of
 * `@vimeo/player`, which throws "error fetching the embed code from Vimeo"
 * when oEmbed is blocked (localhost, domain allowlists, some privacy settings).
 *
 * On flaky networks (e.g. captive / satellite Wi‑Fi) player.vimeo.com often
 * fails with "connection was reset". After a short wait we surface a fallback
 * link — cross-origin iframes do not expose load errors reliably.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { extractVimeoId, vimeoPlayerEmbedSrc } from '@/lib/vimeo';
import { normalizeStoredVideoUrl } from '@/lib/video-url';

interface LazyVimeoPlayerProps {
  vimeoUrl: string;
  posterUrl?: string;
  posterAlt?: string;
}

const EMBED_FAIL_MS = 7000;

export function LazyVimeoPlayer({
  vimeoUrl,
  posterUrl,
  posterAlt = '',
}: LazyVimeoPlayerProps) {
  const locale = useLocale();
  const [playing, setPlaying] = useState(false);
  const [embedMaybeFailed, setEmbedMaybeFailed] = useState(false);

  const normalizedUrl = normalizeStoredVideoUrl(vimeoUrl);
  const videoId = extractVimeoId(normalizedUrl);
  const embedSrc = vimeoPlayerEmbedSrc(normalizedUrl, { autoplay: true });
  const watchUrl = videoId ? `https://vimeo.com/${videoId}` : normalizedUrl;

  useEffect(() => {
    if (!playing) {
      setEmbedMaybeFailed(false);
      return;
    }
    const timer = window.setTimeout(() => setEmbedMaybeFailed(true), EMBED_FAIL_MS);
    return () => window.clearTimeout(timer);
  }, [playing]);

  if (!videoId || !embedSrc) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black/50 text-vp-text-soft">
        Invalid Vimeo URL
      </div>
    );
  }

  const failCopy =
    locale === 'zh'
      ? '无法加载视频（可能是网络限制）。请稍后重试，或在 Vimeo 上打开。'
      : 'Video couldn’t load (often a network restriction). Try again later, or open on Vimeo.';
  const watchLabel = locale === 'zh' ? '在 Vimeo 上观看' : 'Watch on Vimeo';

  if (playing) {
    return (
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={embedSrc}
          title="Vimeo video"
          className="h-full w-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
        {embedMaybeFailed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
            <p className="max-w-md text-sm font-light text-white/90">{failCopy}</p>
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium uppercase tracking-wide text-white underline-offset-4 hover:underline"
            >
              {watchLabel}
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="group relative block aspect-video w-full cursor-pointer border-0 bg-black p-0"
      onClick={() => setPlaying(true)}
      aria-label="Play video"
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={posterAlt}
          fill
          className="object-cover"
          sizes="(max-width: 992px) 100vw, 60vw"
        />
      ) : null}
      <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/90 bg-black/40">
          <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
        </span>
      </span>
    </button>
  );
}
