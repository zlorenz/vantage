'use client';

/**
 * PortableTextVideoEmbed — lazy Vimeo/YouTube player for blog body URLs.
 */

import { useEffect, useState } from 'react';
import { LazyVimeoPlayer } from '@/components/portfolio/LazyVimeoPlayer';
import { parseVideoUrl } from '@/lib/video-url';
import { LazyYouTubePlayer } from '@/components/ui/LazyYouTubePlayer';

interface PortableTextVideoEmbedProps {
  url: string;
}

export function PortableTextVideoEmbed({ url }: PortableTextVideoEmbedProps) {
  const parsed = parseVideoUrl(url);

  if (!parsed) {
    return (
      <a href={url} className="text-vp-link underline-offset-2 hover:underline">
        {url}
      </a>
    );
  }

  if (parsed.provider === 'youtube') {
    return <LazyYouTubePlayer videoId={parsed.id} />;
  }

  return <LazyVimeoOembedPoster vimeoUrl={url} />;
}

function LazyVimeoOembedPoster({ vimeoUrl }: { vimeoUrl: string }) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { thumbnail_url?: string } | null) => {
        if (cancelled) return;
        setPosterUrl(data?.thumbnail_url ?? '');
      })
      .catch(() => {
        if (!cancelled) setPosterUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [vimeoUrl]);

  if (posterUrl === null) {
    return <div className="aspect-video w-full animate-pulse bg-black/50" aria-hidden />;
  }

  if (!posterUrl) {
    return <LazyVimeoPlayer vimeoUrl={vimeoUrl} />;
  }

  return <LazyVimeoPlayer vimeoUrl={vimeoUrl} posterUrl={posterUrl} />;
}
