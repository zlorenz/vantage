import type {PortfolioVideoFields} from '@portfolio-videos';

/** Stable lookup key for server-resolved video posters. */
export function workInternalVideoPosterKey(
  video: PortfolioVideoFields,
  index: number,
): string {
  return (
    video._key?.trim() ||
    video.vimeoUrl?.trim() ||
    video.xinpianchangUrl?.trim() ||
    `film-${index}`
  );
}
