/**
 * Video URL helpers — re-export shared package + thin aliases for Next.js.
 */

export {
  extractVideoUrls,
  getPortableTextBlockPlainText,
  isEmbeddableVideoUrl,
  isVideoUrlOnlyText,
  normalizeStoredVideoUrl,
  parseVideoUrl,
  type ParsedVideoUrl,
  type VideoProvider,
} from '@video-url'

export {extractVimeoId, vimeoThumbnailUrl} from '@video-url'
export {extractYouTubeId, youTubePosterUrl} from '@video-url'
