'use client';

/**
 * PortableTextVideoEmbed — lazy Vimeo/YouTube player for blog body URLs.
 */

import { LazyVimeoPlayer, PROSE_VIDEO_POSTER_SIZES } from '@/components/portfolio/LazyVimeoPlayer';
import { vimeoThumbnailUrl } from '@/lib/vimeo';
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

  return (
    <LazyVimeoPlayer
      vimeoUrl={parsed.url}
      posterUrl={vimeoThumbnailUrl(parsed.url) ?? undefined}
      posterSizes={PROSE_VIDEO_POSTER_SIZES}
    />
  );
}
