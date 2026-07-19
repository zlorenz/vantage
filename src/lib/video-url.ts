import { extractVimeoId } from '@/lib/vimeo';
import { extractYouTubeId } from '@/lib/youtube';
import type { PortableTextBlock } from '@/types/sanity';

type PtSpan = { _type?: string; text?: string };

const VIDEO_URL_PATTERN =
  /https?:\/\/(?:www\.)?(?:vimeo\.com\/(?:video\/)?\d+(?:[?#][^\s]*)?|youtube\.com\/watch\?v=[\w-]+(?:[&?#][^\s]*)?|youtu\.be\/[\w-]+(?:[?#][^\s]*)?|youtube\.com\/embed\/[\w-]+(?:[?#][^\s]*)?)/gi;

export type VideoProvider = 'vimeo' | 'youtube';

export interface ParsedVideoUrl {
  url: string;
  provider: VideoProvider;
  id: string;
}

export function getPortableTextBlockPlainText(block: PortableTextBlock): string {
  if (block._type !== 'block' || !Array.isArray(block.children)) return '';
  return (block.children as PtSpan[])
    .filter((child) => child._type === 'span')
    .map((child) => child.text ?? '')
    .join('');
}

export function extractVideoUrls(text: string): string[] {
  return [...text.matchAll(VIDEO_URL_PATTERN)].map((match) => match[0]);
}

export function isVideoUrlOnlyText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const urls = extractVideoUrls(trimmed);
  if (!urls.length) return false;

  const remainder = urls
    .reduce((acc, url) => acc.replace(url, ''), trimmed)
    .replace(/\s+/g, '')
    .trim();

  return !remainder;
}

/** Decode WP/JSON artifacts like literal `\u0026` in stored Vimeo query strings. */
export function normalizeStoredVideoUrl(url: string): string {
  return url
    .replace(/\\u0026/gi, '&')
    .replace(/\\\\u0026/gi, '&')
    .trim();
}

export function parseVideoUrl(url: string): ParsedVideoUrl | null {
  const normalized = normalizeStoredVideoUrl(url);
  const vimeoId = extractVimeoId(normalized);
  if (vimeoId) {
    return { url: normalized, provider: 'vimeo', id: vimeoId };
  }

  const youtubeId = extractYouTubeId(normalized);
  if (youtubeId) {
    return { url: normalized, provider: 'youtube', id: youtubeId };
  }

  return null;
}
