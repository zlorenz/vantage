/**
 * Server-only: resolve poster URLs for work-internal detail video grids.
 *
 * Priority per film:
 * 1. videos[].thumbnail (player-only override)
 * 2. Main film: campaign featuredImage
 * 3. Provider still (Vimeo API / YouTube maxres)
 */

import {
  resolvePortfolioVideoPosterSource,
  resolvePortfolioVideos,
  type PortfolioVideoFields,
} from '@portfolio-videos';
import {urlForImage} from '@/lib/sanity';
import {parseVideoUrl, youTubePosterUrl} from '@/lib/video-url';
import {fetchHighestVimeoThumbnailUrl} from '@/lib/vimeo';
import {xinpianchangToEmbedUrl} from '@/lib/xinpianchang';
import type {InternalLibraryEntry, SanityImage} from '@/types/sanity';
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

function sanityPosterUrl(image?: SanityImage | null): string | undefined {
  if (!image?.asset) return undefined;
  return urlForImage(image).width(960).height(540).fit('crop').url();
}

export async function resolveWorkInternalVideoPosters(
  entry: InternalLibraryEntry,
): Promise<Record<string, string>> {
  const videos = resolvePortfolioVideos(entry).filter(isPlayableVideo);

  const pairs = await Promise.all(
    videos.map(async (video, index) => {
      const key = workInternalVideoPosterKey(video, index);
      const isMainFilm = index === 0;

      const sanityPoster = sanityPosterUrl(
        resolvePortfolioVideoPosterSource({
          thumbnail: video.thumbnail,
          featuredImage: entry.featuredImage,
          isMainFilm,
        }) as SanityImage | undefined,
      );
      if (sanityPoster) return [key, sanityPoster] as const;

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

      // Last resort for XPC-only rows: campaign featured image.
      const featuredFallback = sanityPosterUrl(entry.featuredImage);
      if (featuredFallback) return [key, featuredFallback] as const;
      return null;
    }),
  );

  const posters: Record<string, string> = {};
  for (const pair of pairs) {
    if (pair) posters[pair[0]] = pair[1];
  }
  return posters;
}
