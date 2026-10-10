/**
 * Server-only: resolve poster URLs for work-internal detail video grids.
 * Vimeo → API / oEmbed (i.vimeocdn.com); YouTube → img.youtube.com.
 */

import {resolvePortfolioVideos} from '@portfolio-videos';
import {urlForImage} from '@/lib/sanity';
import {parseVideoUrl, youTubePosterUrl} from '@/lib/video-url';
import {fetchHighestVimeoThumbnailUrl} from '@/lib/vimeo';
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang';
import type {InternalLibraryEntry} from '@/types/sanity';
import type {PortfolioVideoFields} from '@portfolio-videos';
import {workInternalVideoPosterKey} from './video-poster-key';

function isPlayableVideo(video: PortfolioVideoFields): boolean {
  if (video.vimeoUrl?.trim()) {
    const parsed = parseVideoUrl(video.vimeoUrl);
    if (parsed?.provider === 'vimeo' || parsed?.provider === 'youtube') {
      return true;
    }
  }
  return Boolean(
    video.xinpianchangUrl && xinpianchangToEmbedUrl(video.xinpianchangUrl),
  );
}

function featuredPosterUrl(
  entry: InternalLibraryEntry,
): string | undefined {
  if (!entry.featuredImage) return undefined;
  return urlForImage(entry.featuredImage)
    .width(960)
    .height(540)
    .fit('crop')
    .url();
}

export async function resolveWorkInternalVideoPosters(
  entry: InternalLibraryEntry,
): Promise<Record<string, string>> {
  const videos = resolvePortfolioVideos(entry).filter(isPlayableVideo);
  const featured = featuredPosterUrl(entry);

  const pairs = await Promise.all(
    videos.map(async (video, index) => {
      const key = workInternalVideoPosterKey(video, index);

      // Main film keeps the Sanity featured image when present.
      if (index === 0 && featured) {
        return [key, featured] as const;
      }

      const parsed = video.vimeoUrl?.trim()
        ? parseVideoUrl(video.vimeoUrl)
        : null;

      if (parsed?.provider === 'vimeo') {
        const url = await fetchHighestVimeoThumbnailUrl(parsed.url);
        if (url) return [key, url] as const;
      }

      if (parsed?.provider === 'youtube') {
        return [key, youTubePosterUrl(parsed.id, 'maxres')] as const;
      }

      if (featured) return [key, featured] as const;
      return null;
    }),
  );

  const posters: Record<string, string> = {};
  for (const pair of pairs) {
    if (pair) posters[pair[0]] = pair[1];
  }
  return posters;
}
