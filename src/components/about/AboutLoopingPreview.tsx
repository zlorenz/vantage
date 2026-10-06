'use client';

/**
 * About EN looping preview: Vimeo (carousel player) or YouTube (muted iframe).
 * ZH callers never pass a URL.
 */

import {parseVideoUrl} from '@/lib/video-url';
import {CarouselVimeo} from '@/components/prototype/carousel/CarouselVimeo';
import {AboutYouTubePreview} from '@/components/about/AboutYouTubePreview';

type AboutLoopingPreviewProps = {
  url: string;
  active: boolean;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  onReadyChange?: (ready: boolean) => void;
};

export function AboutLoopingPreview({
  url,
  active,
  previewStartSeconds,
  previewEndSeconds,
  onReadyChange,
}: AboutLoopingPreviewProps) {
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;

  if (parsed.provider === 'youtube') {
    return (
      <AboutYouTubePreview
        videoId={parsed.id}
        active={active}
        onReadyChange={onReadyChange}
      />
    );
  }

  return (
    <CarouselVimeo
      vimeoUrl={url}
      active={active}
      previewStartSeconds={previewStartSeconds}
      previewEndSeconds={previewEndSeconds}
      onReadyChange={onReadyChange}
    />
  );
}
