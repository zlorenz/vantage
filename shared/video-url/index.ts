/**
 * Shared Vimeo/YouTube URL helpers for Studio + Next.js.
 */

import {stegaClean} from '@sanity/client/stega'

export type VideoProvider = 'vimeo' | 'youtube'

export interface ParsedVideoUrl {
  url: string
  provider: VideoProvider
  id: string
}

const VIDEO_URL_PATTERN =
  /https?:\/\/(?:www\.)?(?:vimeo\.com\/(?:video\/)?\d+(?:[?#][^\s]*)?|youtube\.com\/watch\?v=[\w-]+(?:[&?#][^\s]*)?|youtu\.be\/[\w-]+(?:[?#][^\s]*)?|youtube\.com\/embed\/[\w-]+(?:[?#][^\s]*)?)/gi

/** Strip draft-mode stega before URL parse/regex. No-op on published strings. */
function cleanUrlInput(url: string): string {
  return stegaClean(url)
}

export function extractVimeoId(url: string): string | null {
  const match = cleanUrlInput(url).match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match?.[1] ?? null
}

export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(cleanUrlInput(url))
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v')
      }
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/)
      if (embedMatch) return embedMatch[1]
    }
  } catch {
    return null
  }

  return null
}

export function extractVideoUrls(text: string): string[] {
  return [...cleanUrlInput(text).matchAll(VIDEO_URL_PATTERN)].map((match) => match[0])
}

export function isVideoUrlOnlyText(text: string): boolean {
  const trimmed = cleanUrlInput(text).trim()
  if (!trimmed) return false

  const urls = extractVideoUrls(trimmed)
  if (!urls.length) return false

  const remainder = urls
    .reduce((acc, url) => acc.replace(url, ''), trimmed)
    .replace(/\s+/g, '')
    .trim()

  return !remainder
}

/** Decode WP/JSON artifacts like literal `\u0026` in stored Vimeo query strings. */
export function normalizeStoredVideoUrl(url: string): string {
  return cleanUrlInput(url)
    .replace(/\\u0026/gi, '&')
    .replace(/\\\\u0026/gi, '&')
    .trim()
}

export function parseVideoUrl(url: string): ParsedVideoUrl | null {
  const normalized = normalizeStoredVideoUrl(url)
  const vimeoId = extractVimeoId(normalized)
  if (vimeoId) {
    return {url: normalized, provider: 'vimeo', id: vimeoId}
  }

  const youtubeId = extractYouTubeId(normalized)
  if (youtubeId) {
    return {url: normalized, provider: 'youtube', id: youtubeId}
  }

  return null
}

export function isEmbeddableVideoUrl(url: string): boolean {
  return Boolean(parseVideoUrl(url))
}

type PtSpan = {_type?: string; text?: string}

/** Plain text from a Portable Text text block (span children only). */
export function getPortableTextBlockPlainText(block: {
  _type?: string
  children?: unknown
}): string {
  if (block._type !== 'block' || !Array.isArray(block.children)) return ''
  return (block.children as PtSpan[])
    .filter((child) => child._type === 'span')
    .map((child) => child.text ?? '')
    .join('')
}

export function youTubePosterUrl(
  videoId: string,
  quality: 'maxres' | 'hq' = 'maxres',
): string {
  const file = quality === 'maxres' ? 'maxresdefault.jpg' : 'hqdefault.jpg'
  return `https://img.youtube.com/vi/${videoId}/${file}`
}

/** Public Vimeo still (no oEmbed). */
export function vimeoThumbnailUrl(urlOrId: string): string | null {
  const id = /^\d+$/.test(urlOrId) ? urlOrId : extractVimeoId(urlOrId)
  if (!id) return null
  return `https://vumbnail.com/${id}.jpg`
}

export {fetchVideoOEmbedTitle} from './oembed'
